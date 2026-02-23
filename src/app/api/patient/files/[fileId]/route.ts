import { withClerkAuth } from "@/middlewares/withClerkAuth";
import { NextRequest, NextResponse } from "next/server";
import prismaClient from "@/lib/prisma";
import { getFile } from "@/services/azure-blob";

export const GET = withClerkAuth<{ fileId: string }>(
  async (req: NextRequest, { params, auth }) => {
    const { fileId } = await params;
    const id = Number(fileId);

    if (isNaN(id)) {
      return NextResponse.json({ error: "Invalid file ID" }, { status: 400 });
    }

    // Look up the file
    const file = await prismaClient.file.findFirst({
      where: { id, isActive: true },
      select: {
        id: true,
        name: true,
        url: true,
        size: true,
        Folder: {
          select: {
            userId: true,
            User: { select: { userId: true } },
          },
        },
        FileSetting: {
          select: {
            privacy: true,
            FileClinicShares: {
              select: {
                Clinic: { select: { id: true } },
              },
            },
          },
        },
      },
    });

    if (!file) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    const privacy = file.FileSetting?.privacy ?? "PRIVATE";
    const fileOwnerId = file.Folder.User.userId;

    // Owner always has access
    if (auth.userId !== fileOwnerId) {
      if (privacy === "PRIVATE") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      if (privacy === "CLINIC") {
        // Check if the requesting user is a clinic member of one of the shared clinics
        const sharedClinicIds =
          file.FileSetting?.FileClinicShares.map((s) => s.Clinic.id) ?? [];

        if (sharedClinicIds.length === 0) {
          return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const currentUser = await prismaClient.user.findUnique({
          where: { userId: auth.userId },
          select: { id: true },
        });
        if (!currentUser) {
          return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Check if user is a clinic member of any shared clinic
        const memberAccess = await prismaClient.clinicMember.findFirst({
          where: {
            userId: currentUser.id,
            clinicId: { in: sharedClinicIds },
            isActive: true,
          },
          select: { id: true },
        });

        if (!memberAccess) {
          return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
      }
      // PUBLIC: anyone authenticated can access
    }

    // Extract the blob path from the URL and serve it
    // The URL is the full Azure blob URL; we need to extract the blob name
    try {
      const urlObj = new URL(file.url);
      // Azure blob URL format: https://<account>.blob.core.windows.net/<container>/<blobName>
      const pathParts = urlObj.pathname.split("/");
      // Remove the first empty string and the container name
      const blobName = pathParts.slice(2).join("/");

      const buffer = await getFile(blobName);
      if (!buffer) {
        return NextResponse.json(
          { error: "File content not found" },
          { status: 404 }
        );
      }

      return new NextResponse(buffer, {
        headers: {
          "Content-Disposition": `inline; filename="${file.name.replace(/["\\\r\n]/g, "_")}"`,
          "Content-Length": buffer.length.toString(),
          "Cache-Control": "private, no-cache",
        },
      });
    } catch {
      return NextResponse.json(
        { error: "Failed to retrieve file" },
        { status: 500 }
      );
    }
  }
);

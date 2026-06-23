"use client";

import { useState } from "react";
import { toast } from "sonner";
import { RefreshCw, Users, Download, Loader2, FileDown, FileCode, FileText } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { extractRegistrationListAction } from "@/actions/clinics/konsulta-report.action";
import { Badge } from "@/components/ui/badge";
import type { ErlAssignment } from "@/services/konsulta/types";

interface ExtractRegistrationPanelProps {
	clinicUid: string;
}

export function ExtractRegistrationPanel({ clinicUid }: ExtractRegistrationPanelProps) {
	const [startDate, setStartDate] = useState("");
	const [endDate, setEndDate] = useState("");
	const [loading, setLoading] = useState(false);
	const [assignments, setAssignments] = useState<ErlAssignment[]>([]);
	const [hasExtracted, setHasExtracted] = useState(false);
	const [currentPage, setCurrentPage] = useState(1);
	const [pageSize, setPageSize] = useState(10);

	const handleExtract = async () => {
		if (!startDate || !endDate) {
			toast.error("Please provide both start and end dates.");
			return;
		}

		// Convert YYYY-MM-DD to MM/DD/YYYY
		const formatDate = (dateStr: string) => {
			const [y, m, d] = dateStr.split("-");
			return `${m}/${d}/${y}`;
		};

		setLoading(true);
		setHasExtracted(true);
		
		const res = await extractRegistrationListAction({
			clinicUid,
			startDate: formatDate(startDate),
			endDate: formatDate(endDate),
		});
		
		setLoading(false);

		if (res.status && res.data) {
			setAssignments(res.data);
			setCurrentPage(1); // Reset to first page on new extraction
			toast.success(res.message || "Extraction successful.");
		} else {
			toast.error(res.message || "Extraction failed.");
			setAssignments([]);
		}
	};

	const handleExportCsv = () => {
		if (assignments.length === 0) return;

		const headers = [
			"Assigned PIN",
			"Assigned Name",
			"Type",
			"Sex",
			"DOB",
			"Status",
			"Reg. Date",
			"Eff. Year",
			"Primary PIN",
			"Primary Name",
			"Primary Sex",
			"Primary DOB",
			"Mobile No.",
			"Landline No.",
			"New Cat",
			"New Cat Desc",
			"Package Type"
		];

		const escapeCsv = (str: string | undefined | null) => {
			if (!str) return "";
			const s = String(str).replace(/"/g, '""');
			return `"${s}"`;
		};

		const rows = assignments.map(a => {
			const assignedName = `${a.pAssignedLastName}, ${a.pAssignedFirstName} ${a.pAssignedMiddleName || ""} ${a.pAssignedExtName || ""}`.trim();
			const primaryName = `${a.pPrimaryLastName}, ${a.pPrimaryFirstName} ${a.pPrimaryMiddleName || ""} ${a.pPrimaryExtName || ""}`.trim();
			const statusStr = a.pAssignedStatus === "1" ? "Active" : a.pAssignedStatus === "2" ? "Inactive" : a.pAssignedStatus;

			return [
				escapeCsv(a.pAssignedPin),
				escapeCsv(assignedName),
				escapeCsv(a.pAssignedType === "MM" ? "Member" : "Dependent"),
				escapeCsv(a.pAssignedSex),
				escapeCsv(a.pAssignedDateOfBirth),
				escapeCsv(statusStr),
				escapeCsv(a.pAssignedDate),
				escapeCsv(a.pEffYear),
				escapeCsv(a.pPrimaryPIN),
				escapeCsv(primaryName),
				escapeCsv(a.pPrimarySex),
				escapeCsv(a.pPrimaryDateOfBirth),
				escapeCsv(a.pMobileNumber),
				escapeCsv(a.pLandlineNumber),
				escapeCsv(a.pMemberNewCat),
				escapeCsv(a.pMemberNewCatDesc),
				escapeCsv(a.pPackageType)
			].join(",");
		});

		const csvContent = [headers.join(","), ...rows].join("\n");
		const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
		const url = URL.createObjectURL(blob);
		
		const link = document.createElement("a");
		link.setAttribute("href", url);
		link.setAttribute("download", `Konsulta_ERL_${startDate}_to_${endDate}.csv`);
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
	};

	const handleExportPdf = () => {
		if (assignments.length === 0) return;

		const printWindow = window.open('', '_blank');
		if (!printWindow) {
			toast.error("Please allow pop-ups to print PDF.");
			return;
		}

		const headers = [
			"Assigned PIN", "Assigned Name", "Type", "Sex", "DOB", "Status",
			"Reg. Date", "Eff. Year", "Primary PIN", "Primary Name",
			"Pri. Sex", "Pri. DOB", "Mobile", "Landline", "New Cat",
			"New Cat Desc", "Pkg Type"
		];

		const escapeHtml = (unsafe: string | undefined | null) => {
			if (!unsafe) return "";
			return String(unsafe)
				.replace(/&/g, "&amp;")
				.replace(/</g, "&lt;")
				.replace(/>/g, "&gt;")
				.replace(/"/g, "&quot;")
				.replace(/'/g, "&#039;");
		};

		const rowsHtml = assignments.map(a => {
			const assignedName = `${a.pAssignedLastName}, ${a.pAssignedFirstName} ${a.pAssignedMiddleName || ""} ${a.pAssignedExtName || ""}`.trim();
			const primaryName = `${a.pPrimaryLastName}, ${a.pPrimaryFirstName} ${a.pPrimaryMiddleName || ""} ${a.pPrimaryExtName || ""}`.trim();
			const statusStr = a.pAssignedStatus === "1" ? "Active" : a.pAssignedStatus === "2" ? "Inactive" : a.pAssignedStatus;

			return `<tr>
				<td>${escapeHtml(a.pAssignedPin)}</td>
				<td>${escapeHtml(assignedName)}</td>
				<td>${escapeHtml(a.pAssignedType === "MM" ? "Member" : "Dependent")}</td>
				<td>${escapeHtml(a.pAssignedSex)}</td>
				<td>${escapeHtml(a.pAssignedDateOfBirth)}</td>
				<td>${escapeHtml(statusStr)}</td>
				<td>${escapeHtml(a.pAssignedDate)}</td>
				<td>${escapeHtml(a.pEffYear)}</td>
				<td>${escapeHtml(a.pPrimaryPIN)}</td>
				<td>${escapeHtml(primaryName)}</td>
				<td>${escapeHtml(a.pPrimarySex)}</td>
				<td>${escapeHtml(a.pPrimaryDateOfBirth)}</td>
				<td>${escapeHtml(a.pMobileNumber)}</td>
				<td>${escapeHtml(a.pLandlineNumber)}</td>
				<td>${escapeHtml(a.pMemberNewCat)}</td>
				<td>${escapeHtml(a.pMemberNewCatDesc)}</td>
				<td>${escapeHtml(a.pPackageType)}</td>
			</tr>`;
		}).join("");

		const html = `
			<html>
			<head>
				<title>Konsulta ERL - ${startDate} to ${endDate}</title>
				<style>
					body { font-family: system-ui, -apple-system, sans-serif; font-size: 10px; margin: 20px; }
					h2 { text-align: center; margin-bottom: 20px; font-size: 16px; }
					table { width: 100%; border-collapse: collapse; }
					th, td { border: 1px solid #ddd; padding: 4px 6px; text-align: left; }
					th { background-color: #f4f4f5; font-weight: 600; white-space: nowrap; }
					@media print {
						@page { size: landscape; margin: 10mm; }
						body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
					}
				</style>
			</head>
			<body>
				<h2>PhilHealth Konsulta Extract Registration List (${startDate} to ${endDate})</h2>
				<table>
					<thead><tr>${headers.map(h => `<th>${h}</th>`).join("")}</tr></thead>
					<tbody>${rowsHtml}</tbody>
				</table>
				<script>
					window.onload = () => { setTimeout(() => { window.print(); window.close(); }, 250); }
				</script>
			</body>
			</html>
		`;

		printWindow.document.write(html);
		printWindow.document.close();
	};

	const totalPages = Math.ceil(assignments.length / pageSize);
	const startIndex = (currentPage - 1) * pageSize;
	const paginatedAssignments = assignments.slice(startIndex, startIndex + pageSize);

	return (
		<div className="space-y-4">
			<Card className="border-primary/20 shadow-sm backdrop-blur-sm bg-background/95">
				<CardHeader>
					<CardTitle className="text-sm flex items-center gap-2">
						<Users className="h-5 w-5 text-primary" />
						Extract Registration List (ERL)
					</CardTitle>
					<CardDescription>
						Retrieve a masterlist of all beneficiaries registered to your facility within a specified date range.
					</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="flex flex-col md:flex-row items-end gap-4 max-w-3xl">
						<div className="space-y-1.5 flex-1 w-full">
							<Label htmlFor="startDate" className="text-muted-foreground font-medium">Start Date</Label>
							<Input
								id="startDate"
								type="date"
								value={startDate}
								onChange={(e) => setStartDate(e.target.value)}
								className="w-full shadow-sm"
							/>
						</div>
						<div className="space-y-1.5 flex-1 w-full">
							<Label htmlFor="endDate" className="text-muted-foreground font-medium">End Date</Label>
							<Input
								id="endDate"
								type="date"
								value={endDate}
								onChange={(e) => setEndDate(e.target.value)}
								className="w-full shadow-sm"
							/>
						</div>
						<Button 
							onClick={handleExtract} 
							disabled={loading} 
							className="w-full md:w-auto min-w-[140px] shadow-sm"
						>
							{loading ? (
								<>
									<Loader2 className="mr-2 h-4 w-4 animate-spin" />
									Extracting...
								</>
							) : (
								<>
									<Download className="mr-2 h-4 w-4" />
									Extract List
								</>
							)}
						</Button>
					</div>

					{assignments.length > 0 ? (
						<div className="mt-8 rounded-lg border bg-card text-card-foreground shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-300">
							<div className="p-3 border-b bg-muted/30 flex justify-between items-center">
								<span className="text-sm font-medium">
									Registration List ({assignments.length} total)
								</span>
								<DropdownMenu>
									<DropdownMenuTrigger asChild>
										<Button size="sm" variant="outline" className="h-8 gap-1.5 shadow-sm">
											<FileDown className="h-3.5 w-3.5" />
											Export List
										</Button>
									</DropdownMenuTrigger>
									<DropdownMenuContent align="end" className="w-48">
										<DropdownMenuItem onClick={handleExportCsv} className="cursor-pointer">
											<FileCode className="mr-2 h-4 w-4 text-emerald-600" />
											Export to Excel (CSV)
										</DropdownMenuItem>
										<DropdownMenuItem onClick={handleExportPdf} className="cursor-pointer">
											<FileText className="mr-2 h-4 w-4 text-red-600" />
											Export to PDF
										</DropdownMenuItem>
									</DropdownMenuContent>
								</DropdownMenu>
							</div>
							<div className="overflow-x-auto">
								<Table className="whitespace-nowrap">
									<TableHeader className="bg-muted/50">
										<TableRow>
											<TableHead className="w-[120px]">Assigned PIN</TableHead>
											<TableHead>Assigned Name</TableHead>
											<TableHead>Type</TableHead>
											<TableHead>Sex</TableHead>
											<TableHead>DOB</TableHead>
											<TableHead>Status</TableHead>
											<TableHead>Reg. Date</TableHead>
											<TableHead>Eff. Year</TableHead>
											<TableHead>Primary PIN</TableHead>
											<TableHead>Primary Name</TableHead>
											<TableHead>Pri. Sex</TableHead>
											<TableHead>Pri. DOB</TableHead>
											<TableHead>Mobile</TableHead>
											<TableHead>Landline</TableHead>
											<TableHead>New Cat</TableHead>
											<TableHead>New Cat Desc</TableHead>
											<TableHead>Pkg Type</TableHead>
										</TableRow>
									</TableHeader>
									<TableBody>
										{paginatedAssignments.map((assignment, idx) => (
											<TableRow key={idx} className="group hover:bg-muted/30 transition-colors">
												<TableCell className="font-mono text-xs">{assignment.pAssignedPin}</TableCell>
												<TableCell className="font-medium">
													{`${assignment.pAssignedLastName}, ${assignment.pAssignedFirstName} ${assignment.pAssignedMiddleName || ""} ${assignment.pAssignedExtName || ""}`.trim()}
												</TableCell>
												<TableCell>
													<Badge variant={assignment.pAssignedType === "MM" ? "default" : "secondary"} className="text-[10px] uppercase tracking-wider">
														{assignment.pAssignedType === "MM" ? "Member" : "Dependent"}
													</Badge>
												</TableCell>
												<TableCell>{assignment.pAssignedSex}</TableCell>
												<TableCell className="text-muted-foreground">{assignment.pAssignedDateOfBirth}</TableCell>
												<TableCell>
													{assignment.pAssignedStatus === "1" ? (
														<Badge variant="outline" className="text-green-600 border-green-600 bg-green-50">Active</Badge>
													) : assignment.pAssignedStatus === "2" ? (
														<Badge variant="outline" className="text-red-600 border-red-600 bg-red-50">Inactive</Badge>
													) : (
														assignment.pAssignedStatus
													)}
												</TableCell>
												<TableCell className="text-muted-foreground">{assignment.pAssignedDate}</TableCell>
												<TableCell className="text-muted-foreground">{assignment.pEffYear}</TableCell>
												<TableCell className="font-mono text-xs">{assignment.pPrimaryPIN}</TableCell>
												<TableCell className="text-muted-foreground">
													{`${assignment.pPrimaryLastName}, ${assignment.pPrimaryFirstName} ${assignment.pPrimaryMiddleName || ""} ${assignment.pPrimaryExtName || ""}`.trim()}
												</TableCell>
												<TableCell className="text-muted-foreground">{assignment.pPrimarySex}</TableCell>
												<TableCell className="text-muted-foreground">{assignment.pPrimaryDateOfBirth}</TableCell>
												<TableCell className="text-muted-foreground">{assignment.pMobileNumber || "-"}</TableCell>
												<TableCell className="text-muted-foreground">{assignment.pLandlineNumber || "-"}</TableCell>
												<TableCell className="text-muted-foreground">{assignment.pMemberNewCat || "-"}</TableCell>
												<TableCell className="text-muted-foreground">{assignment.pMemberNewCatDesc || "-"}</TableCell>
												<TableCell className="text-muted-foreground">{assignment.pPackageType}</TableCell>
											</TableRow>
										))}
									</TableBody>
								</Table>
							</div>
							<div className="p-4 border-t bg-muted/20 text-xs text-muted-foreground flex flex-col sm:flex-row justify-between items-center gap-4">
								<div className="flex items-center gap-4">
									<span>Total records: <strong className="text-foreground">{assignments.length}</strong></span>
									<div className="flex items-center gap-2">
										<span>Rows per page:</span>
										<select 
											className="h-7 rounded border border-input bg-background px-2 py-1 text-foreground shadow-sm text-xs"
											value={pageSize}
											onChange={(e) => {
												setPageSize(Number(e.target.value));
												setCurrentPage(1);
											}}
										>
											{[10, 20, 30, 50, 100].map(size => (
												<option key={size} value={size}>{size}</option>
											))}
										</select>
									</div>
								</div>
								
								<div className="flex items-center gap-2">
									<Button 
										variant="outline" 
										size="sm" 
										className="h-7 text-xs px-3"
										onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
										disabled={currentPage === 1}
									>
										Previous
									</Button>
									<span className="px-2">
										Page <strong className="text-foreground">{currentPage}</strong> of <strong className="text-foreground">{totalPages}</strong>
									</span>
									<Button 
										variant="outline" 
										size="sm"
										className="h-7 text-xs px-3"
										onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
										disabled={currentPage === totalPages || totalPages === 0}
									>
										Next
									</Button>
								</div>
							</div>
						</div>
					) : (
						!loading && hasExtracted && (
							<div className="mt-8 p-12 text-center rounded-lg border border-dashed flex flex-col items-center justify-center text-muted-foreground bg-muted/10 animate-in fade-in duration-300">
								<Users className="h-10 w-10 opacity-20 mb-3" />
								<p>No registration records found for the selected date range.</p>
							</div>
						)
					)}
				</CardContent>
			</Card>
		</div>
	);
}

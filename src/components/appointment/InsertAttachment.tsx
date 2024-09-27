"use client";

import { FileInput, FileUploader, FileUploaderContent, FileUploaderItem } from "@components/extention/file-upload";
import BackSubmitAndNext from "@components/SubmitAndNext";
import Each from "@components/utils/Each";
import { bookAppointmentAtom } from "@state/book-appointment";
import { useAtom } from "jotai";
import { Paperclip } from "lucide-react";
import { useState } from "react";


interface InsertAttachmentProps {
    nextStep?: () => void;
    prevStep?: () => void;
    isFirstStep?: boolean;
    isLastStep?: boolean;
}
export const InsertAttachment = ({isFirstStep, isLastStep, nextStep, prevStep}: InsertAttachmentProps) => {
  const [bookAppointment, setBookAppointment] = useAtom(bookAppointmentAtom);
  

  const handleChangeAttachments = (files: File[] | null) => {
    if(!files) return;
    setBookAppointment({
      ...bookAppointment,
      attachments: files
    });
  }
  const dropZoneConfig = {
    maxFiles: 5,
    maxSize: 1024 * 1024 * 4,
    multiple: true,
  };

  const action = async () => {
    nextStep?.();
  }

  return (
    <form action={action}>
      <div className="prose max-w-full shadow-lg w-full p-8 bg-white rounded-md">
        <h2>Insert Attachment</h2>
      
        <FileUploader
          value={bookAppointment.attachments ?? []}
          onValueChange={handleChangeAttachments}
          dropzoneOptions={dropZoneConfig}
          className="relative bg-background rounded-lg p-2 container"
        >
          <FileInput className="outline-dashed outline-1 outline-white">
            <div className="flex items-center justify-center flex-col pt-3 pb-4 w-full ">
              <FileSvgDraw />
            </div>
          </FileInput>
          <FileUploaderContent>
            <Each
              of={bookAppointment.attachments ?? []}
              render={(file, i) => (
                <FileUploaderItem key={i} index={i}>
                  <Paperclip className="h-4 w-4 stroke-current" />
                  <span>{file.name}</span>
                </FileUploaderItem>
              )}
            />
          </FileUploaderContent>
        </FileUploader>
      </div>
      <div className="mt-5">
        <BackSubmitAndNext
          labels={{
            submit: "Save & Continue",
            next: "Skip"
          }}
          disabled={{
            next: isLastStep,
            previous: isFirstStep,
            submit: !bookAppointment.attachments?.length,
          }}
          actions={{
            previous: prevStep,
            next: nextStep,
              
          }}
        />
      </div>
    </form>
  );
};

const FileSvgDraw = () => {
  return (
    <>
      <svg
        className="w-8 h-8 mb-3 text-gray-500 dark:text-gray-400"
        aria-hidden="true"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 20 16"
      >
        <path
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"
        />
      </svg>
      <p className="mb-1 text-sm text-gray-500 dark:text-gray-400">
        <span className="font-semibold">Click to upload</span>
        &nbsp; or drag and drop
      </p>
      <p className="text-xs text-gray-500 dark:text-gray-400">
        SVG, PNG, JPG or GIF
      </p>
    </>
  );
};
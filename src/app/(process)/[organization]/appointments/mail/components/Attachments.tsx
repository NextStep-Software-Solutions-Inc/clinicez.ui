"use client";

import Each from "@components/utils/Each";
import Image from "next/image";
import React, { useCallback, useState } from "react";
import ImageViewer from 'react-simple-image-viewer';


interface AttachmentsProps {
    attachments: string[];
}

export default function Attachments({attachments}: AttachmentsProps) {

  const [currentImage, setCurrentImage] = useState(0);
  const [isViewerOpen, setIsViewerOpen] = useState(false);

  const openImageViewer = useCallback((index: number) => {
    setCurrentImage(index);
    setIsViewerOpen(true);
  }, []);

  const closeImageViewer = () => {
    setCurrentImage(0);
    setIsViewerOpen(false);
  };

  return (
    <div className="z-50 relative">
      <h5>Attachments:</h5>
      <div className="flex flex-wrap gap-2 my-2">
        <Each
          of={attachments}
          fallback={<span className="text-muted-foreground">No Attachments</span>}
          render={(attachment, index) => (
            <div 
              key={index}
              className="w-[200px] h-auto shadow-lg cursor-pointer" 
              onClick={() => openImageViewer(index)}
            >
              <Image width={150} height={150} className="rounded w-full" src={attachment} alt="" />
            </div>
          )}
        />
      </div>
      {isViewerOpen && (
        <ImageViewer
          src={ attachments }
          currentIndex={ currentImage }
          disableScroll={ false }
          closeOnClickOutside={ true }
          onClose={ closeImageViewer }
          backgroundStyle={{
            backgroundColor: "rgba(0,0,0,0.9)"
          }}
        />
      )}
    </div>
  );
}

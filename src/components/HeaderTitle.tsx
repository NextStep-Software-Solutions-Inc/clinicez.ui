import { cn } from "@/lib/utils"
import { StyledText } from "./StyledText";

interface HeaderTitleProps {
  header?: string | Array<{ text: string; className?: string; breakLine?: boolean }>
  description?: string | Array<{ text: string; className?: string; breakLine?: boolean }>
  className?: string;
}

export default function HeaderTitle({ header, description, className, ...props }: HeaderTitleProps) {
  const renderContent = (
    content: string | Array<{ text: string; className?: string; breakLine?: boolean }>,
    defaultClassName: string,
  ) => {
    if (Array.isArray(content)) {
      return <StyledText segments={content} as="span" />
    }
    return <span className={defaultClassName}>{content}</span>
  }

  return (
    <div className={cn("space-y-4", className)}>
      <div className="text-3xl md:text-4xl lg:text-5xl font-semibold tracking-normal">
        <div className="mb-2">{header && renderContent(header, "text-slate-900")}</div>
      </div>
      {description && (
        <div className="text-label-v2 md:text-lg lg:text-xl mt-4 mx-auto text-base max-w-5xl">
          {renderContent(description, "")}
        </div>
      )}
    </div>
  )
  // return (
  //   <div className={cn("text-center space-y-4")}>
  //     <div className="text-3xl md:text-4xl lg:text-5xl font-semibold tracking-normal">
  //       <div className={`${props.primaryColor ? props.primaryColor : "text-slate-900"} mb-2`}>
  //         {props.header}
  //         {props.subheader && (
  //           <div
  //             className={`${props.secondaryColor ? props.secondaryColor : "text-green-900"} text-2xl md:text-3xl lg:text-4xl mt-2`}
  //           >
  //             {props.subheader}
  //           </div>
  //         )}
  //       </div>
  //     </div>

  //     {props.description && (
  //       <p
  //         className={`text-center ${props.subheadingColor ? props.subheadingColor : "text-gray-500"} md:text-lg lg:text-xl mt-4 mx-auto text-base max-w-3xl`}
  //       >
  //         {props.description}
  //       </p>
  //     )}
  //   </div>
  // )
}

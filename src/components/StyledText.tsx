import React from "react"

interface TextSegment {
  text: string
  className?: string
  breakLine?: boolean
}

interface StyledTextProps {
  segments: TextSegment[]
  as?: keyof React.JSX.IntrinsicElements
  className?: string
}

export const StyledText = ({ segments = [], as: Component = "p", className = "" }: StyledTextProps) => {
  if (!segments || segments.length === 0) {
    return null
  }

  return (
    <Component className={className}>
      {segments.map((segment, index) => (
        <React.Fragment key={index}>
          {segment.breakLine && <br />}
          <span className={segment.className || ""}>{segment.text}</span>
        </React.Fragment>
      ))}
    </Component>
  )
}

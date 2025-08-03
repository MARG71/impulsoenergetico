import * as React from "react"

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        className={`w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm 
        focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent 
        disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
        ref={ref}
        {...props}
      />
    )
  }
)

Textarea.displayName = "Textarea"

export { Textarea }

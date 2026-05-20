import { User } from "lucide-react"

interface UserAvatarIconProps extends React.SVGProps<SVGSVGElement> {
  src?: string | null
  size?: number
}

export function UserAvatarIcon({ src, size = 19, className, ...props }: UserAvatarIconProps) {
  if (src) {
    return (
      <div 
        className={`rounded-full overflow-hidden flex-shrink-0 ${className}`}
        style={{ width: size, height: size }}
      >
        <img 
          src={src} 
          alt="User avatar" 
          className="w-full h-full object-cover"
        />
      </div>
    )
  }
  
  return <User className={className} style={{ width: size, height: size }} {...props} />
}
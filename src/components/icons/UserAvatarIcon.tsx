interface UserAvatarIconProps extends React.SVGProps<SVGSVGElement> {
  src?: string | null
  size?: number
}

export function UserAvatarIcon({ src, size = 24, className, ...props }: UserAvatarIconProps) {
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
  
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="currentColor"
      className={className}
      {...props}
    >
      <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
    </svg>
  )
}
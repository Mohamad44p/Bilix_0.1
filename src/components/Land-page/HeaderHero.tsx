"use client"
import { cn } from "@/lib/utils"
import { Menu, X } from "lucide-react"
import React from "react"
import { Button } from "../ui/button"
import Link from "next/link"
import { useAuth } from "@clerk/nextjs"

const Logo = () => {
  return (
    <div className="flex items-center gap-2">
      <div className="relative size-8">
        <div className="absolute size-6 rounded-full bg-primary/80" />
        <div className="absolute bottom-0 right-0 size-8 rounded-full bg-primary" />
      </div>
      <span className="text-3xl font-medium">Billx</span>
    </div>
  )
}

const menuItems = [
  { name: "Features", href: "#link" },
  { name: "Solution", href: "#link" },
  { name: "Pricing", href: "#link" },
  { name: "About", href: "#link" },
]

const HeaderHero = () => {
  const [menuState, setMenuState] = React.useState(false)
  const [isScrolled, setIsScrolled] = React.useState(false)
  const { isSignedIn } = useAuth();

  React.useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50)
    }
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])
  return (
    <header className="relative text-white">
        
      <nav data-state={menuState ? "active" : "inactive"} className="fixed z-20 w-full px-2">
        <div
          className={cn(
            "mx-auto mt-2 max-w-6xl px-6 transition-all duration-300 lg:px-12",
            isScrolled && "bg-background/80 max-w-4xl rounded-2xl border-[1px] shadow-lg border-neutral-600 backdrop-blur-xl lg:px-5",
          )}
        >
          <div className="relative flex flex-wrap items-center justify-between gap-6 py-3 lg:gap-0 lg:py-4">
            <div className="flex w-full justify-between lg:w-auto">
              <Link href="/" aria-label="home" className="flex items-center -ml-2">
                <Logo />
              </Link>

              <button
                onClick={() => setMenuState(!menuState)}
                aria-label={menuState == true ? "Close Menu" : "Open Menu"}
                className="relative z-20 -m-2.5 -mr-4 block cursor-pointer p-2.5 lg:hidden"
              >
                <Menu className="in-data-[state=active]:rotate-180 in-data-[state=active]:scale-0 in-data-[state=active]:opacity-0 m-auto size-6 duration-200" />
                <X className="in-data-[state=active]:rotate-0 in-data-[state=active]:scale-100 in-data-[state=active]:opacity-100 absolute inset-0 m-auto size-6 -rotate-180 scale-0 opacity-0 duration-200" />
              </button>
            </div>

            <div className="absolute inset-0 m-auto hidden size-fit lg:block">
              <ul className="flex gap-8 text-sm">
                {menuItems.map((item, index) => (
                  <li key={index}>
                    <a
                      href={item.href}
                      className="text-muted-foreground relative block overflow-hidden px-3 py-2 transition-colors hover:text-foreground"
                    >
                      <span className="relative">{item.name}</span>
                      <span className="absolute bottom-0 left-0 h-0.5 w-full transform bg-gradient-to-r from-primary to-primary/50 transition-transform duration-300 -translate-x-full group-hover:translate-x-0" />
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            <div 
              className={cn(
                "bg-background/95 fixed inset-x-0 top-0 z-10 mt-16 h-screen w-full border-t border-primary/90 p-6 transition-all duration-300 backdrop-blur-xl lg:relative lg:inset-x-auto lg:mt-0 lg:h-auto lg:w-auto lg:border-0 lg:bg-transparent lg:p-0",
                menuState ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0 pointer-events-none",
                "lg:translate-y-0 lg:opacity-100 lg:pointer-events-auto"
              )}>
              <div className="lg:hidden">
                <ul className="space-y-6 text-base">
                  {menuItems.map((item, index) => (
                    <li key={index}>
                      <a
                        href={item.href}
                        className="text-muted-foreground hover:text-accent-foreground block duration-150"
                      >
                        <span>{item.name}</span>
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="flex w-full flex-col space-y-3 sm:flex-row sm:gap-3 sm:space-y-0 md:w-fit">
                {isSignedIn ? (
                  <>
                    <Button 
                      asChild 
                      size="sm" 
                      className={cn(
                        "bg-gradient-to-r from-primary to-primary/80 hover:opacity-90 transition-opacity"
                      )}>
                      <Link href="/dashboard"><span>Dashboard</span></Link>
                    </Button>
                  </>
                ) : (
                  <>
                    <Button 
                      asChild 
                      variant="outline" 
                      size="sm" 
                      className={cn(
                        "hover:border-primary/50 transition-colors",
                        isScrolled && "lg:hidden"
                      )}>
                      <Link href="/sign-in"><span>Login</span></Link>
                    </Button>
                    <Button 
                      asChild 
                      size="sm" 
                      className={cn(
                        "bg-gradient-to-r from-primary to-primary/80 hover:opacity-90 transition-opacity",
                        isScrolled && "lg:hidden"
                      )}>
                      <Link href="/sign-up"><span>Sign Up</span></Link>
                    </Button>
                    <Button 
                      asChild 
                      size="sm" 
                      className={cn(
                        "bg-gradient-to-r from-primary to-primary/80 hover:opacity-90 transition-opacity",
                        isScrolled ? "lg:inline-flex" : "hidden"
                      )}>
                      <Link href="/sign-up"><span>Get Started</span></Link>
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </nav>
    </header>
  )
}

export default HeaderHero
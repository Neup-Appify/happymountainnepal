"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu, Mountain, Search, User } from "lucide-react";
// Removed import { getDestinations } from "@/lib/db";
import type { Destination } from "@/lib/types";

interface NavLink {
  title: string;
  href?: string;
  description?: string;
  items?: NavLink[];
}

const staticNavLinks: NavLink[] = [
    { href: "/tours", title: "Tours" },
  {
    title: "Resources",
    items: [
      {
        title: "Trail Reports",
        href: "/reports",
        description: "Current trail conditions, weather notes, and logistics updates.",
      },
      {
        title: "Trek Comparisons",
        href: "/comparisons",
        description: "Decision-stage pages comparing Nepal's most searched treks.",
      },
      {
        title: "Client Stories",
        href: "/stories",
        description: "Detailed traveler stories that show how the team handled real trips.",
      },
      {
        title: "Departure Calendar",
        href: "/departures",
        description: "Upcoming trek departures and current planning windows.",
      },
      {
        title: "Trek Hubs",
        href: "/trek-hubs",
        description: "Clustered planning hubs for Everest, Annapurna, Manaslu, and Langtang.",
      },
    ],
  },
  {
    title: "Tools",
    items: [
      {
        title: "Cost Calculator",
        href: "/tools/cost-calculator",
        description: "Estimate trek budgets and start the pricing conversation earlier.",
      },
      {
        title: "Trek Planner",
        href: "/tools/trek-planner",
        description: "Match month, budget, fitness, and trip length to the right trek.",
      },
    ],
  },
  {
    title: "About",
    items: [
      {
        title: "About Us",
        href: "/about",
        description: "Learn about our story, mission, and values.",
      },
      {
        title: "Our Team",
        href: "/about/teams",
        description: "Meet the experts behind your Himalayan adventure.",
      },
      {
        title: "Reviews",
        href: "/reviews",
        description: "Read stories from our happy and satisfied travelers.",
      },
      {
        title: "Legal",
        description: "Legal information and licenses.",
        items: [
            {
                title: 'Documents',
                href: '/legal/documents',
                description: "View our company's legal information and licenses."
            },
            {
                title: 'Terms & Conditions',
                href: '/legal/terms',
                description: 'Read our terms and conditions.'
            },
            {
                title: 'Privacy Policy',
                href: '/legal/privacy',
                description: 'Our privacy policy.'
            }
        ]
      },
    ],
  },
    { href: "/blog", title: "Blog" },
    { href: "/contact", title: "Contact" },
];


const getGridCols = (items?: NavLink[]): string => {
    if(!items) return "";
    const hasSubItems = items.some(item => item.items && item.items.length > 0);
    if(hasSubItems) {
        const hasSubSubItems = items.some(item => item.items && item.items.some(subItem => subItem.items && subItem.items.length > 0));
        if (hasSubSubItems) return "md:grid-cols-3"
        return "md:grid-cols-2"
    }
    return "md:grid-cols-1"
}


export function Header() {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
  const [navLinks, setNavLinks] = React.useState<NavLink[]>(staticNavLinks);

  // The getDestinations call was removed as it's no longer needed here.
  // The HeaderV3 component uses a static navLinks array which is more appropriate for a client component.
  // If dynamic destinations are needed, they should be fetched in a server component and passed down,
  // or handled in a client component with proper loading states.

  const renderNavLinks = (links: NavLink[], isSubmenu = false) => {
    return links.map(link => {
        if(link.items) {
            return (
                <NavigationMenuItem key={link.title}>
                    <NavigationMenuTrigger>{link.title}</NavigationMenuTrigger>
                    <NavigationMenuContent>
                        <ul className={cn("grid w-[400px] gap-3 p-4 md:w-[500px] lg:w-[600px]", getGridCols(link.items))}>
                            {renderNavLinks(link.items, true)}
                        </ul>
                    </NavigationMenuContent>
                </NavigationMenuItem>
            )
        }
        if(link.href && !isSubmenu){
            return (
                <NavigationMenuItem key={link.title}>
                    <Link href={link.href} passHref>
                        <NavigationMenuLink
                        className={cn(
                            navigationMenuTriggerStyle(),
                            pathname === link.href ? "bg-accent text-accent-foreground" : ""
                        )}
                        >
                        {link.title}
                        </NavigationMenuLink>
                    </Link>
                </NavigationMenuItem>
            )
        }

        return (
            <ListItem
                key={link.title}
                title={link.title}
                href={link.href}
                >
                {link.description}
            </ListItem>
        )
    })
  }

  const renderMobileNavLinks = (links: NavLink[], isSubmenu = false) => {
    return links.map(link => {
        if(link.items) {
            return (
                <div className={isSubmenu ? "pl-5" : ""} key={link.title}>
                    <h3 className="font-semibold text-muted-foreground my-2">{link.title}</h3>
                    {renderMobileNavLinks(link.items, true)}
                </div>
            )
        }
        return (
            <MobileLink
                key={link.href}
                href={link.href!}
                pathname={pathname}
                setOpen={setIsMobileMenuOpen}
                >
                {link.title}
            </MobileLink>
        )
    })
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center">
        <div className="mr-4 hidden md:flex">
          <Link href="/" className="mr-6 flex items-center space-x-2">
            <Mountain className="h-6 w-6 text-primary" />
            <span className="hidden font-bold sm:inline-block">
              Happy Mountain
            </span>
          </Link>
          <NavigationMenu>
            <NavigationMenuList>
                {renderNavLinks(navLinks)}
            </NavigationMenuList>
          </NavigationMenu>
        </div>

        {/* Mobile Menu */}
        <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              className="mr-2 px-0 text-base hover:bg-transparent focus-visible:bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 md:hidden"
            >
              <Menu className="h-6 w-6" />
              <span className="sr-only">Toggle Menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="pr-0 w-full">
            <Link
              href="/"
              className="mb-6 flex items-center"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <Mountain className="mr-2 h-6 w-6 text-primary" />
              <span className="font-bold">Happy Mountain</span>
            </Link>
            <div className="flex flex-col space-y-3">
                {renderMobileNavLinks(navLinks)}
            </div>
          </SheetContent>
        </Sheet>
        <Link href="/" className="flex items-center space-x-2 md:hidden">
            <Mountain className="h-6 w-6 text-primary" />
            <span className="font-bold">Happy Mountain</span>
        </Link>


        <div className="flex flex-1 items-center justify-end space-x-2">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/search">
              <Search className="h-5 w-5" />
              <span className="sr-only">Search</span>
            </Link>
          </Button>
          <Button variant="ghost" size="icon" asChild>
            <Link href="/profile">
              <User className="h-5 w-5" />
              <span className="sr-only">Profile</span>
            </Link>
          </Button>
        </div>
      </div>
    </header>
  );
}

const ListItem = React.forwardRef<
  React.ElementRef<"a">,
  React.ComponentPropsWithoutRef<"a">
>(({ className, title, children, href, ...props }, ref) => {
  return (
    <li>
      <NavigationMenuLink asChild>
        <Link
          href={href || ''}
          ref={ref}
          className={cn(
            "block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground",
            className
          )}
          {...props}
        >
          <div className="text-sm font-medium leading-none">{title}</div>
          <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
            {children}
          </p>
        </Link>
      </NavigationMenuLink>
    </li>
  );
});
ListItem.displayName = "ListItem";


interface MobileLinkProps {
    href: string;
    children: React.ReactNode;
    pathname: string;
    setOpen: (open: boolean) => void;
}

function MobileLink({ href, children, pathname, setOpen }: MobileLinkProps) {
  return (
    <Link
      href={href}
      onClick={() => setOpen(false)}
      className={cn(
        "text-foreground/70 transition-colors hover:text-foreground",
        pathname === href && "text-foreground font-semibold"
      )}
    >
      {children}
    </Link>
  );
}


'use client';

import * as React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Mountain, Search, Menu, X, ChevronDown, ChevronRight, Phone, Mail, MapPin, Edit } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { HeaderV3Nav, type NavLink } from './HeaderV3Nav';
import { cn } from '@/lib/utils';
import { AnimatePresence, motion } from 'framer-motion';
import { useSiteProfile } from '@/hooks/use-site-profile';
import { useHeaderLinks } from '@/hooks/use-navigation-data';
import { useAdminControl } from '@/context/AdminControlContext';
import { usePathname } from 'next/navigation';

// Fallback data if API fails
const defaultNavLinks: NavLink[] = [
  {
    title: 'Activities',
    children: [
      { title: 'Trekking', href: '/tours?type=trek', description: 'Journey through stunning mountain trails.' },
      { title: 'Tour', href: '/tours?type=tour', description: 'Explore cultural and natural heritage sites.' },
      { title: 'Climbing', href: '/tours?type=expedition', description: 'Challenge yourself with peak climbing adventures.' },
      { title: 'Jungle Safari', href: '/tours?type=safari', description: 'Discover wildlife in lush national parks.' },
    ],
  },
  {
    title: 'Destinations',
    children: [
      {
        title: 'Nepal',
        href: '/tours?region=Nepal',
        description: "Home to the world's highest peak.",
      },
      {
        title: 'Tibet',
        href: '/tours?region=Tibet',
        description: 'The roof of the world.',
      },
      {
        title: 'Bhutan',
        href: '/tours?region=Bhutan',
        description: 'The last Himalayan kingdom.',
      },
      {
        title: 'India',
        href: '/tours?region=India',
        description: 'Diverse landscapes from Himalayas to the sea.',
      },
    ],
  },
  {
    title: 'About',
    children: [
      {
        title: 'Company',
        description: 'Our story and team.',
        children: [
          {
            title: 'About Us',
            href: '/about',
            description: 'Learn about our mission and values.',
          },
          {
            title: 'Our Team',
            href: '/about/teams',
            description: 'Meet the experts behind your adventure.',
          },
        ],
      },
      {
        title: 'Community',
        description: 'Stories and feedback.',
        children: [
          {
            title: 'Reviews',
            href: '/reviews',
            description: 'Read stories from our happy travelers.',
          },
          {
            title: 'Blog',
            href: '/blog',
            description: 'Guides, stories, and advice.',
          },
        ],
      },
      {
        title: 'Legal',
        description: 'Policies and documents.',
        children: [
          {
            title: 'Documents',
            href: '/legal/documents',
            description: "View our company's legal licenses."
          },
          {
            title: 'Terms & Conditions',
            href: '/legal/terms',
            description: 'Read our terms and conditions.'
          },
          {
            title: 'Privacy Policy',
            href: '/legal/privacy',
            description: 'Our commitment to your privacy.'
          }
        ]
      },
    ],
  },
  { href: '/contact', title: 'Contact' },
  { href: '/search', title: 'Search' },
];

function MobileMenuList({ setMenuOpen, navLinks }: { setMenuOpen: (open: boolean) => void; navLinks: NavLink[] }) {
  const [navigationStack, setNavigationStack] = React.useState<{ items: NavLink[], title: string }[]>([
    { items: navLinks, title: 'Menu' }
  ]);
  const { profile } = useSiteProfile();
  const whatsappLink = `https://wa.me/${profile?.phone?.replace(/\D/g, '')}`;

  const currentLevel = navigationStack[navigationStack.length - 1];

  const navigateForward = (link: NavLink) => {
    if (link.children && link.children.length > 0) {
      setNavigationStack([...navigationStack, { items: link.children, title: link.title }]);
    }
  };

  const navigateBack = () => {
    if (navigationStack.length > 1) {
      setNavigationStack(navigationStack.slice(0, -1));
    }
  };

  return (
    <div className="flex flex-col h-full bg-background overflow-hidden">
      {/* Header with back button and title (only show from level 2+) */}
      {navigationStack.length > 1 && (
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <button
              onClick={navigateBack}
              className="flex items-center text-primary hover:text-primary/80 transition-colors"
            >
              <ChevronRight className="h-5 w-5 rotate-180" />
            </button>
            <h2 className="font-headline text-base font-semibold text-foreground">{currentLevel.title}</h2>
          </div>
        </div>
      )}

      {/* Menu items */}
      <div className="flex-1 overflow-y-auto px-6 pt-4 pb-20">
        <nav className="flex flex-col w-full max-w-lg mx-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentLevel.title}
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -20, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              {currentLevel.items.map(link => {
                if (link.children && link.children.length > 0) {
                  return (
                    <button
                      key={link.title}
                      onClick={() => navigateForward(link)}
                      className="flex items-center justify-between w-full py-4 text-left border-b border-border/40 last:border-0 group"
                    >
                      <div>
                        <span className="font-headline text-lg font-medium text-foreground group-hover:text-primary transition-colors">
                          {link.title}
                        </span>
                        {link.description && (
                          <p className="text-sm text-muted-foreground mt-1">{link.description}</p>
                        )}
                      </div>
                      <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                    </button>
                  );
                }
                return (
                  <Link
                    key={link.href}
                    href={link.href!}
                    className="block py-4 border-b border-border/40 last:border-0 hover:text-primary transition-colors"
                    onClick={() => setMenuOpen(false)}
                  >
                    <span className="font-headline text-lg font-medium">{link.title}</span>
                    {link.description && (
                      <p className="text-sm text-muted-foreground mt-1">{link.description}</p>
                    )}
                  </Link>
                );
              })}
            </motion.div>
          </AnimatePresence>

          {navigationStack.length === 1 && (
            <div className="mt-8 pt-8 border-t flex flex-col gap-3">
              <Button variant="outline" className="w-full justify-start text-lg h-12" asChild>
                <a href={`mailto:${profile?.contactEmail || ''}`}>
                  <Mail className="w-5 h-5 mr-2" />
                  <span className="ml-2">Email Now</span>
                </a>
              </Button>
              <Button className="w-full justify-start text-lg h-12" asChild>
                <a href={whatsappLink} target="_blank" rel="noopener noreferrer">
                  <Image src="/whatsapp.svg" alt="WhatsApp" width={20} height={20} />
                  <span className="ml-2">Contact Now</span>
                </a>
              </Button>
            </div>
          )}
        </nav>
      </div>
    </div>
  );
}

const hasChildren = (item: NavLink): item is Required<Pick<NavLink, 'children'>> & NavLink => {
  return Array.isArray(item.children) && item.children.length > 0;
}

// Check if any child has level 3 (grandchildren)
const hasLevel3 = (children: NavLink[] | undefined): boolean => {
  if (!children) return false;
  return children.some(child => hasChildren(child));
}

export function HeaderV3({ initialIsManager = false, initialProfile, initialLinks }: { initialIsManager?: boolean, initialProfile?: any, initialLinks?: any[] }) {
  const [isMenuOpen, setMenuOpen] = React.useState(false);
  const [activeSubMenu, setActiveSubMenu] = React.useState<NavLink | null>(null);
  const [activeLevel2Item, setActiveLevel2Item] = React.useState<string | null>(null);
  const { profile } = useSiteProfile(initialProfile);
  const { links: apiLinks, loading: linksLoading } = useHeaderLinks(initialLinks);
  const whatsappLink = `https://wa.me/${profile?.phone?.replace(/\D/g, '')}`;

  const { editUrl } = useAdminControl();
  const pathname = usePathname();
  const [isManager, setIsManager] = React.useState(initialIsManager);

  React.useEffect(() => {
    // Check sessionStorage first (persists across page reloads in same tab)
    const checkManagerStatus = () => {
      // If we received initialIsManager as true from server, trust it
      if (initialIsManager) {
        sessionStorage.setItem('isManager', 'true');
        setIsManager(true);
        return;
      }

      let hasManager = false;

      // Check sessionStorage
      const sessionManager = sessionStorage.getItem('isManager');
      if (sessionManager === 'true') {
        hasManager = true;
      } else {
        // Fallback: check cookies only if they are accessible (though HttpOnly ones won't be visible)
        // This is mostly for non-HttpOnly dev cookies or historic reasons
        const cookies = document.cookie;
        const managerCookie = cookies.split('; ').find(row => row.startsWith('manager_username='));
        if (managerCookie) {
          const value = managerCookie.split('=')[1];
          if (value && value.trim() !== '') {
            hasManager = true;
            sessionStorage.setItem('isManager', 'true');
          }
        }
      }

      setIsManager(hasManager);
    };

    // Check on mount
    checkManagerStatus();

    // Listen for custom event when login happens
    const handleLoginEvent = () => {
      sessionStorage.setItem('isManager', 'true');
      setIsManager(true);
    };

    window.addEventListener('managerLoginSuccess', handleLoginEvent);

    return () => {
      window.removeEventListener('managerLoginSuccess', handleLoginEvent);
    };
  }, [initialIsManager]);

  let managerEditTarget: string | null = null;
  let managerButtonText = 'Edit This Page';

  if (isManager) {
    // If a specific edit URL is set via AdminPageControl, use it
    if (editUrl) {
      managerEditTarget = editUrl;
      // Determine button text based on the edit URL
      if (editUrl.includes('/manage/packages/')) {
        managerButtonText = 'Edit Tour';
      } else if (editUrl.includes('/manage/blog/')) {
        managerButtonText = 'Edit Blog';
      } else if (editUrl.includes('/manage/team/')) {
        managerButtonText = 'Edit Team Member';
      } else if (editUrl.includes('/manage/legal/documents/')) {
        managerButtonText = 'Edit Document';
      }
    }
    // For specific pages, link to the appropriate management section
    else if (pathname === '/') {
      managerEditTarget = '/manage';
      managerButtonText = 'Manage Site';
    } else if (pathname === '/blog') {
      managerEditTarget = '/manage/blog';
      managerButtonText = 'Manage Blogs';
    } else if (pathname === '/tours') {
      managerEditTarget = '/manage/packages';
      managerButtonText = 'Manage Tours';
    } else if (pathname === '/legal/documents') {
      managerEditTarget = '/manage/legal/documents';
      managerButtonText = 'Manage Documents';
    } else if (pathname === '/about/teams') {
      managerEditTarget = '/manage/team';
      managerButtonText = 'Manage Team';
    }
    // For all other pages, default to the main manage page
    else {
      managerEditTarget = '/manage';
      managerButtonText = 'Manage Site';
    }
  }

  // Use API links if available, otherwise use default links
  const navLinks = apiLinks.length > 0 ? apiLinks : defaultNavLinks;

  React.useEffect(() => {
    const chatbot = document.getElementById('chatbot-container');
    if (isMenuOpen) {
      document.body.style.overflow = 'hidden';
      if (chatbot) chatbot.style.display = 'none';
    } else {
      document.body.style.overflow = '';
      if (chatbot) chatbot.style.display = '';
    }
    return () => {
      document.body.style.overflow = '';
      if (chatbot) chatbot.style.display = '';
    };
  }, [isMenuOpen]);

  const handleMouseEnter = (item: NavLink) => {
    if (hasChildren(item)) {
      setActiveSubMenu(item);
      // Auto-expand first level 2 item if it has level 3 children
      const firstChildWithLevel3 = item.children?.find((child: NavLink) => hasChildren(child));
      if (firstChildWithLevel3) {
        setActiveLevel2Item(firstChildWithLevel3.title);
      } else {
        setActiveLevel2Item(null);
      }
    } else {
      setActiveSubMenu(null);
      setActiveLevel2Item(null);
    }
  };

  const handleMouseLeave = () => {
    setActiveSubMenu(null);
    setActiveLevel2Item(null);
  };

  const handleLevel2Hover = (title: string) => {
    setActiveLevel2Item(title);
  };

  const contactColumn: NavLink = {
    title: 'Get In Touch',
    description: 'We are here to help you plan your adventure.',
    children: [
      {
        title: 'Call Us',
        href: `tel:${profile?.phone || ''}`,
        description: profile?.phone || 'Loading...',
        icon: Phone
      },
      {
        title: 'Email Us',
        href: `mailto:${profile?.contactEmail || ''}`,
        description: profile?.contactEmail || 'Loading...',
        icon: Mail
      },
      {
        title: 'Find Us',
        href: profile?.locationUrl || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(profile?.address || '')}`,
        description: profile?.location || profile?.address || 'Loading...',
        icon: MapPin,
        target: '_blank'
      },
    ]
  };

  const aboutMenu = navLinks.find((link: NavLink) => link.title === 'About');
  const aboutMenuWithContact = aboutMenu ? {
    ...aboutMenu,
    children: [...(aboutMenu.children || []), contactColumn]
  } : null;

  return (
    <>
      <header
        className={cn(
          "fixed top-0 z-40 w-full bg-background shadow-md transition-all duration-700 ease-smooth",
          isMenuOpen ? "h-screen" : "h-16"
        )}
        onMouseLeave={handleMouseLeave}
      >
        <div className="container flex h-16 items-center justify-between relative z-50 bg-background">

          {/* Left aligned logo */}
          <div className="flex items-center shrink-0">
            <Link href="/" className="flex items-center space-x-2 shrink-0" onClick={() => setMenuOpen(false)}>
              <Image src="https://cdn.neupgroup.com/p3happymountainnepal/logo.png" alt="Happy Mountain Nepal Logo" width={28} height={28} className="h-7 w-7 object-contain" />
              <span className="font-bold font-headline truncate">Happy Mountain Nepal</span>
            </Link>
          </div>

          {/* Centered Desktop Navigation */}
          <div className="hidden md:flex flex-1 justify-center px-4">
            <HeaderV3Nav links={navLinks} onLinkHover={handleMouseEnter} />
          </div>

          {/* Right aligned section */}
          <div className="flex items-center justify-end gap-1.5 sm:gap-3 shrink-0">

            {/* Contact Buttons or Manager Edit Button */}
            <div className="hidden md:flex items-center gap-1.5 sm:gap-2">
              {managerEditTarget ? (
                <Button
                  variant="outline"
                  size="sm"
                  asChild
                  className="h-9 px-3 border-primary/20 hover:border-primary hover:bg-primary/5 hover:text-foreground transition-all group/edit"
                >
                  <Link href={managerEditTarget} className="flex items-center gap-2">
                    <Edit className="h-4 w-4 text-primary group-hover/edit:scale-110 transition-transform" />
                    <span className="hidden sm:inline text-sm font-medium">{managerButtonText}</span>
                  </Link>
                </Button>
              ) : (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    asChild
                    className="h-9 px-3 border-primary/20 hover:border-primary hover:bg-primary/5 hover:text-foreground transition-all group/contact"
                  >
                    <a href={`mailto:${profile?.contactEmail || ''}`} className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-primary group-hover/contact:scale-110 transition-transform" />
                      <span className="hidden sm:inline text-sm font-medium">Email Us</span>
                      <span className="sm:hidden text-sm font-medium">Email now</span>
                    </a>
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    asChild
                    className="h-9 px-3 border-primary/20 hover:border-primary hover:bg-primary/5 hover:text-foreground transition-all group/contact"
                  >
                    <a href={whatsappLink} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2">
                      <Image src="/whatsapp.svg" alt="WhatsApp" width={16} height={16} className="shrink-0 group-hover/contact:scale-110 transition-transform" />
                      <span className="text-sm font-medium">Contact now</span>
                    </a>
                  </Button>
                </>
              )}
            </div>



            {/* Mobile Only Burger (With Morphing Animation) */}
            <div className="md:hidden">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setMenuOpen(!isMenuOpen)}
                className="relative overflow-hidden border-2 border-border hover:border-primary transition-colors"
              >
                <AnimatePresence mode="wait" initial={false}>
                  {isMenuOpen ? (
                    <motion.div
                      key="close"
                      initial={{ rotate: -90, opacity: 0, scale: 0.5 }}
                      animate={{ rotate: 0, opacity: 1, scale: 1 }}
                      exit={{ rotate: 90, opacity: 0, scale: 0.5 }}
                      transition={{ duration: 0.2 }}
                      className="absolute inset-0 flex items-center justify-center"
                    >
                      <X className="h-6 w-6 text-foreground" />
                    </motion.div>
                  ) : (
                    <motion.div
                      key="open"
                      initial={{ rotate: 90, opacity: 0, scale: 0.5 }}
                      animate={{ rotate: 0, opacity: 1, scale: 1 }}
                      exit={{ rotate: -90, opacity: 0, scale: 0.5 }}
                      transition={{ duration: 0.2 }}
                      className="absolute inset-0 flex items-center justify-center"
                    >
                      <Menu className="h-6 w-6 text-foreground" />
                    </motion.div>
                  )}
                </AnimatePresence>
              </Button>
            </div>
          </div>
        </div>

        {/* Mobile Menu Content (Expandable) */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "calc(100vh - 4rem)", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.7, ease: [0.32, 0.72, 0, 1] }}
              className="md:hidden overflow-hidden bg-background absolute top-16 left-0 w-full border-t border-border"
            >
              <MobileMenuList setMenuOpen={setMenuOpen} navLinks={navLinks} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Desktop Mega Menu */}
        <AnimatePresence>
          {activeSubMenu && !isMenuOpen && (
            <motion.div
              className="fixed top-16 w-screen bg-background shadow-lg left-0 hidden md:block"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
            >
              <div className="container mx-auto py-8">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeSubMenu.title}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    transition={{ duration: 0.2 }}
                  >
                    {(() => {
                      const menuChildren = activeSubMenu.title === 'About' && aboutMenuWithContact
                        ? aboutMenuWithContact.children
                        : activeSubMenu.children;

                      const hasAnyLevel3 = hasLevel3(menuChildren);

                      // If there's level 3, use 2-column layout
                      if (hasAnyLevel3) {
                        return (
                          <div className="grid grid-cols-[300px_1fr] gap-12">
                            {/* Column 1: Level 2 items */}
                            <div className="space-y-1">
                              {menuChildren?.map(child => (
                                <div
                                  key={child.title}
                                  onMouseEnter={() => handleLevel2Hover(child.title)}
                                  className={cn(
                                    "px-4 py-3 rounded-lg transition-colors cursor-pointer",
                                    activeLevel2Item === child.title
                                      ? "bg-secondary text-primary"
                                      : "hover:bg-secondary/50"
                                  )}
                                >
                                  {hasChildren(child) ? (
                                    <div>
                                      <div className="font-headline text-base font-semibold">{child.title}</div>
                                      {child.description && (
                                        <p className="text-sm text-muted-foreground mt-1">{child.description}</p>
                                      )}
                                    </div>
                                  ) : (
                                    <Link href={child.href || '#'} className="block">
                                      <div className="font-headline text-base font-semibold">{child.title}</div>
                                      {child.description && (
                                        <p className="text-sm text-muted-foreground mt-1">{child.description}</p>
                                      )}
                                    </Link>
                                  )}
                                </div>
                              ))}
                            </div>

                            {/* Column 2: Level 3 items */}
                            <div>
                              <AnimatePresence mode="wait">
                                {activeLevel2Item && menuChildren?.find(c => c.title === activeLevel2Item) && (
                                  <motion.div
                                    key={activeLevel2Item}
                                    initial={{ opacity: 0, x: 10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -10 }}
                                    transition={{ duration: 0.2 }}
                                  >
                                    {(() => {
                                      const activeItem = menuChildren.find(c => c.title === activeLevel2Item);
                                      if (!activeItem || !hasChildren(activeItem)) return null;

                                      return (
                                        <div className="grid grid-cols-2 gap-6">
                                          {activeItem.children?.map(subItem => (
                                            <Link
                                              key={subItem.title}
                                              href={subItem.href || '#'}
                                              target={subItem.target}
                                              className="group block p-4 rounded-lg hover:bg-secondary/50 transition-colors"
                                            >
                                              <div className="flex items-start gap-2">
                                                {subItem.icon && <subItem.icon className="h-5 w-5 shrink-0 mt-0.5 text-primary" />}
                                                <div className="flex-1">
                                                  <div className="font-headline text-base font-semibold text-foreground group-hover:text-primary transition-colors flex items-center gap-2">
                                                    {subItem.title}
                                                    <ChevronRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                                                  </div>
                                                  {subItem.description && (
                                                    <p className="text-sm text-muted-foreground mt-1">{subItem.description}</p>
                                                  )}
                                                </div>
                                              </div>
                                            </Link>
                                          ))}
                                        </div>
                                      );
                                    })()}
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </div>
                          </div>
                        );
                      } else {
                        // If there's only level 2, show horizontally
                        return (
                          <div className="grid grid-cols-4 gap-8">
                            {menuChildren?.map(child => (
                              <Link
                                key={child.title}
                                href={child.href || '#'}
                                className="group block p-4 rounded-lg hover:bg-secondary/50 transition-colors"
                              >
                                <p className="font-headline text-lg font-semibold text-foreground group-hover:text-primary transition-colors">
                                  {child.title}
                                </p>
                                {child.description && (
                                  <p className="text-sm text-muted-foreground mt-1">{child.description}</p>
                                )}
                              </Link>
                            ))}
                          </div>
                        );
                      }
                    })()}
                  </motion.div>
                </AnimatePresence>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>
    </>
  );
}

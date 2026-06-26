
'use client';

import { Sidebar, SidebarContent, SidebarGroup, SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarProvider, SidebarMenuItem } from "@/components/ui/sidebar";
import { LayoutGrid, Mail, Users, Mountain, ArrowLeft, UsersRound, Package, Handshake, ShieldAlert, PictureInPicture, PenSquare, Star, UserCircle2, Landmark, MessageSquare, LogOut, Layout, ArrowRightLeft, Backpack, CreditCard, ListTodo, MapPin } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { usePathname } from "next/navigation";
import { AutoHideScrollbar } from "@/components/ui/AutoHideScrollbar";

export default function ManageLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const userName = "Admin";
    const userHandle = "happymountain";
    const pathname = usePathname();

    const handleLogout = async () => {
        try {
            // Clear sessionStorage
            sessionStorage.removeItem('isManager');

            await fetch('/api/manager-auth', {
                method: 'DELETE',
            });
            window.location.href = '/manage/login';
        } catch (error) {
            console.error('Logout error:', error);
        }
    };

    return (
        <SidebarProvider>
            <div className="min-h-screen">
                <div className="max-w-[1400px] mx-auto relative">
                    <div className="flex">
                        <AutoHideScrollbar className="w-64 border-r hidden md:block fixed h-screen flex-shrink-0 max-w-[1400px]">
                            <Sidebar className="h-full">
                                <SidebarContent className="p-2 md:p-4 flex flex-col justify-between min-h-full">
                                    <SidebarGroup>
                                        <SidebarGroupLabel>Management</SidebarGroupLabel>
                                        <SidebarMenu>
                                            <SidebarMenuItem>
                                                <SidebarMenuButton href="/manage" isActive={pathname === '/manage'} tooltip="Dashboard">
                                                    <LayoutGrid />
                                                    <span>Dashboard</span>
                                                </SidebarMenuButton>
                                            </SidebarMenuItem>
                                            <SidebarMenuItem>
                                                <SidebarMenuButton href="/manage/profile" isActive={pathname.startsWith('/manage/profile')} tooltip="Profile">
                                                    <UserCircle2 />
                                                    <span>Profile</span>
                                                </SidebarMenuButton>
                                            </SidebarMenuItem>
                                            <SidebarMenuItem>
                                                <SidebarMenuButton href="/manage/components" isActive={pathname.startsWith('/manage/components')} tooltip="Components">
                                                    <Layout />
                                                    <span>Components</span>
                                                </SidebarMenuButton>
                                            </SidebarMenuItem>
                                            <SidebarMenuItem>
                                                <SidebarMenuButton href="/manage/uploads" isActive={pathname.startsWith('/manage/uploads')} tooltip="Uploads">
                                                    <PictureInPicture />
                                                    <span>Uploads</span>
                                                </SidebarMenuButton>
                                            </SidebarMenuItem>
                                            <SidebarMenuItem>
                                                <SidebarMenuButton href="/manage/inquiries" isActive={pathname.startsWith('/manage/inquiries')} tooltip="Inquiries">
                                                    <Mail />
                                                    <span>Inquiries</span>
                                                </SidebarMenuButton>
                                            </SidebarMenuItem>
                                            <SidebarMenuItem>
                                                <SidebarMenuButton href="/manage/chatbot" isActive={pathname.startsWith('/manage/chatbot')} tooltip="Chatbot">
                                                    <MessageSquare />
                                                    <span>Chatbot</span>
                                                </SidebarMenuButton>
                                            </SidebarMenuItem>
                                            <SidebarMenuItem>
                                                <SidebarMenuButton href="/manage/interactions" isActive={pathname.startsWith('/manage/interactions')} tooltip="Interactions">
                                                    <Users />
                                                    <span>Interactions</span>
                                                </SidebarMenuButton>
                                            </SidebarMenuItem>
                                            <SidebarMenuItem>
                                                <SidebarMenuButton href="/manage/blog" isActive={pathname.startsWith('/manage/blog')} tooltip="Blog">
                                                    <PenSquare />
                                                    <span>Blog</span>
                                                </SidebarMenuButton>
                                            </SidebarMenuItem>
                                            <SidebarMenuItem>
                                                <SidebarMenuButton href="/manage/team" isActive={pathname.startsWith('/manage/team')} tooltip="Team">
                                                    <UsersRound />
                                                    <span>Team</span>
                                                </SidebarMenuButton>
                                            </SidebarMenuItem>
                                            <SidebarMenuItem>
                                                <SidebarMenuButton href="/manage/locations" isActive={pathname.startsWith('/manage/locations')} tooltip="Locations">
                                                    <MapPin />
                                                    <span>Locations</span>
                                                </SidebarMenuButton>
                                            </SidebarMenuItem>
                                            <SidebarMenuItem>
                                                <SidebarMenuButton href="/manage/packages" isActive={pathname.startsWith('/manage/packages')} tooltip="Packages">
                                                    <Package />
                                                    <span>Packages</span>
                                                </SidebarMenuButton>
                                            </SidebarMenuItem>
                                            <SidebarMenuItem>
                                                <SidebarMenuButton href="/manage/payment" isActive={pathname.startsWith('/manage/payment')} tooltip="Payment">
                                                    <CreditCard />
                                                    <span>Payment</span>
                                                </SidebarMenuButton>
                                            </SidebarMenuItem>
                                            <SidebarMenuItem>
                                                <SidebarMenuButton href="/manage/partners" isActive={pathname.startsWith('/manage/partners')} tooltip="Partners">
                                                    <Handshake />
                                                    <span>Partners</span>
                                                </SidebarMenuButton>
                                            </SidebarMenuItem>
                                            <SidebarMenuItem>
                                                <SidebarMenuButton href="/manage/reviews" isActive={pathname.startsWith('/manage/reviews')} tooltip="Reviews">
                                                    <Star />
                                                    <span>Reviews</span>
                                                </SidebarMenuButton>
                                            </SidebarMenuItem>
                                            <SidebarMenuItem>
                                                <SidebarMenuButton href="/manage/legal" isActive={pathname.startsWith('/manage/legal')} tooltip="Legal">
                                                    <Landmark />
                                                    <span>Legal</span>
                                                </SidebarMenuButton>
                                            </SidebarMenuItem>
                                            <SidebarMenuItem>
                                                <SidebarMenuButton href="/manage/site/errors" isActive={pathname.startsWith('/manage/site/errors')} tooltip="Site Errors">
                                                    <ShieldAlert />
                                                    <span>Site Errors</span>
                                                </SidebarMenuButton>
                                            </SidebarMenuItem>
                                            <SidebarMenuItem>
                                                <SidebarMenuButton href="/manage/redirects" isActive={pathname.startsWith('/manage/redirects')} tooltip="Redirects">
                                                    <ArrowRightLeft />
                                                    <span>Redirects</span>
                                                </SidebarMenuButton>
                                            </SidebarMenuItem>
                                            <SidebarMenuItem>
                                                <SidebarMenuButton onClick={handleLogout} tooltip="Logout">
                                                    <LogOut />
                                                    <span>Logout</span>
                                                </SidebarMenuButton>
                                            </SidebarMenuItem>
                                            <SidebarMenuItem>
                                                <SidebarMenuButton href="/" tooltip="Back to Site">
                                                    <ArrowLeft />
                                                    <span>Back to Site</span>
                                                </SidebarMenuButton>
                                            </SidebarMenuItem>
                                            <SidebarMenuItem>
                                                <SidebarMenuButton href="/manage/feedbacks" isActive={pathname.startsWith('/manage/feedbacks')} tooltip="Feedbacks">
                                                    <ListTodo />
                                                    <span>Feedbacks</span>
                                                </SidebarMenuButton>
                                            </SidebarMenuItem>
                                            <SidebarMenuItem>
                                                <SidebarMenuButton href="/manage/gears" isActive={pathname.startsWith('/manage/gears')} tooltip="Gears Library">
                                                    <Backpack />
                                                    <span>Gears Library</span>
                                                </SidebarMenuButton>
                                            </SidebarMenuItem>
                                        </SidebarMenu>
                                    </SidebarGroup>
                                </SidebarContent>
                            </Sidebar>
                        </AutoHideScrollbar>
                        <main className="flex-1 md:ml-64 p-2 md:p-6 min-h-screen">
                            {children}
                        </main>
                    </div>
                </div>
            </div>
        </SidebarProvider>
    );
}

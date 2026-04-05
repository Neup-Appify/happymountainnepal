
'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { PlusCircle, GripVertical, Pencil, Trash2, Users } from 'lucide-react';
import type { TeamMember, TeamGroup } from '@/lib/types';
import { useState, useEffect } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { createTeamGroup, updateTeamGroup, deleteTeamGroup, batchUpdateTeamMemberPositions, batchUpdateTeamGroupOrder, getTeamMembers, getTeamGroups } from '@/lib/db';
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DeleteTeamMemberDialog } from '@/components/manage/DeleteTeamMemberDialog';

export default function TeamManagementPage() {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [teamGroups, setTeamGroups] = useState<TeamGroup[]>([]);
  const [originalTeamMembers, setOriginalTeamMembers] = useState<TeamMember[]>([]);
  const [originalTeamGroups, setOriginalTeamGroups] = useState<TeamGroup[]>([]);
  const [hasPendingChanges, setHasPendingChanges] = useState(false);
  const [loading, setLoading] = useState(true);
  const [draggedMember, setDraggedMember] = useState<TeamMember | null>(null);
  const [draggedGroup, setDraggedGroup] = useState<TeamGroup | null>(null);
  const [dragOverGroupId, setDragOverGroupId] = useState<string | null>(null);
  const [dragOverMemberIndex, setDragOverMemberIndex] = useState<number | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupDescription, setNewGroupDescription] = useState('');
  const [editingGroup, setEditingGroup] = useState<TeamGroup | null>(null);
  const [isGroupDialogOpen, setIsGroupDialogOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [members, groups] = await Promise.all([
        getTeamMembers(),
        getTeamGroups(),
      ]);

      setTeamMembers(members);
      setTeamGroups(groups);
      setOriginalTeamMembers(members);
      setOriginalTeamGroups(groups);
      setHasPendingChanges(false);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load team data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateGroup = async () => {
    if (!newGroupName.trim()) return;

    setIsUpdating(true);
    try {
      const maxOrder = teamGroups.length > 0 ? Math.max(...teamGroups.map(g => g.orderIndex)) : -1;
      await createTeamGroup({
        name: newGroupName,
        description: newGroupDescription,
        orderIndex: maxOrder + 1,
      });

      toast({
        title: 'Success',
        description: 'Team group created successfully',
      });

      setNewGroupName('');
      setNewGroupDescription('');
      setIsGroupDialogOpen(false);
      fetchData();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create team group',
        variant: 'destructive',
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleUpdateGroup = async () => {
    if (!editingGroup || !newGroupName.trim()) return;

    setIsUpdating(true);
    try {
      await updateTeamGroup(editingGroup.id, {
        name: newGroupName,
        description: newGroupDescription,
      });

      toast({
        title: 'Success',
        description: 'Team group updated successfully',
      });

      setEditingGroup(null);
      setNewGroupName('');
      setNewGroupDescription('');
      setIsGroupDialogOpen(false);
      fetchData();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update team group',
        variant: 'destructive',
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteGroup = async (groupId: string) => {
    if (!confirm('Are you sure you want to delete this group? Members will be moved to "Ungrouped".')) return;

    setIsUpdating(true);
    try {
      await deleteTeamGroup(groupId);
      toast({
        title: 'Success',
        description: 'Team group deleted successfully',
      });
      fetchData();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete team group',
        variant: 'destructive',
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const openEditDialog = (group: TeamGroup) => {
    setEditingGroup(group);
    setNewGroupName(group.name);
    setNewGroupDescription(group.description || '');
    setIsGroupDialogOpen(true);
  };

  const openCreateDialog = () => {
    setEditingGroup(null);
    setNewGroupName('');
    setNewGroupDescription('');
    setIsGroupDialogOpen(true);
  };

  // Drag and drop handlers for members with optimistic UI
  const handleMemberDragStart = (member: TeamMember) => {
    setDraggedMember(member);
  };
  
  const handleMemberDragOver = (e: React.DragEvent, targetGroupId: string | null, targetMemberIndex: number) => {
    e.preventDefault();
    e.stopPropagation();
  
    if (!draggedMember) return;
  
    // Determine the current group and index of the dragged member
    const sourceGroupId = draggedMember.groupId || null;
    const membersInSourceGroup = teamMembers
      .filter(m => (m.groupId || null) === sourceGroupId)
      .sort((a, b) => (a.orderIndex || 0) - (b.orderIndex || 0));
    const sourceIndex = membersInSourceGroup.findIndex(m => m.id === draggedMember.id);
  
    // If the position hasn't changed, do nothing
    if (sourceGroupId === targetGroupId && sourceIndex === targetMemberIndex) {
      return;
    }
  
    // 1. Remove the dragged member from its current position
    let tempMembers = teamMembers.filter(m => m.id !== draggedMember.id);
  
    // 2. Re-index the source group if it's different from the target
    if (sourceGroupId !== targetGroupId) {
      tempMembers = tempMembers.map(m => {
        if ((m.groupId || null) === sourceGroupId && m.orderIndex && m.orderIndex > sourceIndex) {
          return { ...m, orderIndex: m.orderIndex - 1 };
        }
        return m;
      });
    }
  
    // 3. Get members of the target group and make space
    const targetGroupMembers = tempMembers
      .filter(m => (m.groupId || null) === targetGroupId)
      .sort((a, b) => (a.orderIndex || 0) - (b.orderIndex || 0));
  
    const updatedTargetGroupMembers = targetGroupMembers.map(m => {
      if (m.orderIndex !== undefined && m.orderIndex >= targetMemberIndex) {
        return { ...m, orderIndex: m.orderIndex + 1 };
      }
      return m;
    });
  
    // 4. Update the state with the members from the target group with their new indices
    tempMembers = tempMembers.map(m => {
      const updatedMember = updatedTargetGroupMembers.find(um => um.id === m.id);
      return updatedMember || m;
    });
  
    // 5. Insert the dragged member into its new position
    const updatedDraggedMember: TeamMember = {
      ...draggedMember,
      groupId: targetGroupId || undefined,
      orderIndex: targetMemberIndex,
    };
  
    tempMembers.push(updatedDraggedMember);
  
    // Final re-sorting to ensure everything is in order before setting state
    tempMembers.sort((a, b) => ((a.orderIndex || 0) - (b.orderIndex || 0)));
  
    setTeamMembers(tempMembers);
    setDragOverGroupId(targetGroupId);
  };
  

  const handleMemberDragEnd = () => {
    setDraggedMember(null);
    setDragOverGroupId(null);
    setDragOverMemberIndex(null);
  };

  const handleMemberDrop = async (targetGroupId: string | null, targetIndex: number) => {
    if (!draggedMember) return;

    setIsUpdating(true);

    // Use the already optimistically-updated `teamMembers` state
    const updates = teamMembers.map(member => ({
        id: member.id,
        groupId: member.groupId || null,
        orderIndex: member.orderIndex || 0,
    }));
    
    try {
      await batchUpdateTeamMemberPositions(updates);

      toast({
        title: 'Success',
        description: 'Team member position updated',
      });

      fetchData(); // Refetch to confirm state from DB
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update team member position',
        variant: 'destructive',
      });
      // Revert optimistic update on error by fetching original data
      fetchData();
    } finally {
      setDraggedMember(null);
      setDragOverGroupId(null);
      setDragOverMemberIndex(null);
      setIsUpdating(false);
    }
  };

  // Drag and drop handlers for groups with optimistic UI
  const handleGroupDragStart = (group: TeamGroup) => {
    setDraggedGroup(group);
  };

  const handleGroupDragOver = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    e.stopPropagation();
  
    if (!draggedGroup || targetIndex === teamGroups.findIndex(g => g.id === draggedGroup.id)) return;
  
    // Reorder the groups optimistically
    const reordered = [...teamGroups];
    const draggedIndex = reordered.findIndex(g => g.id === draggedGroup.id);
    
    if (draggedIndex === -1) return;
  
    const [removed] = reordered.splice(draggedIndex, 1);
    reordered.splice(targetIndex, 0, removed);
  
    const updatedGroups = reordered.map((group, index) => ({
      ...group,
      orderIndex: index,
    }));
  
    setTeamGroups(updatedGroups);
  };

  const handleGroupDragEnd = () => {
    setDraggedGroup(null);
  };
  
  const handleGroupDrop = async (targetIndex: number) => {
    if (!draggedGroup) return;
  
    setIsUpdating(true);
    try {
      const updates = teamGroups.map((group, index) => ({
        id: group.id,
        orderIndex: index,
      }));
  
      await batchUpdateTeamGroupOrder(updates);
  
      toast({
        title: 'Success',
        description: 'Group order updated',
      });
  
      fetchData();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update group order',
        variant: 'destructive',
      });
      // Revert optimistic update on error
      fetchData();
    } finally {
      setDraggedGroup(null);
      setIsUpdating(false);
    }
  };

  const getMembersInGroup = (groupId: string | null) => {
    return teamMembers
      .filter(m => (m.groupId || null) === groupId)
      .sort((a, b) => (a.orderIndex || 0) - (b.orderIndex || 0));
  };

  const ungroupedMembers = getMembersInGroup(null);

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold !font-headline">Team Management</h1>
        <div className="flex gap-2">
          <Button onClick={openCreateDialog} variant="outline">
            <Users className="mr-2 h-4 w-4" />
            Create Group
          </Button>
          <Button asChild>
            <Link href="/manage/team/create">
              <PlusCircle className="mr-2 h-4 w-4" />
              Add Member
            </Link>
          </Button>
        </div>
      </div>

      <Card className="relative">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Organize Your Team</CardTitle>
              <CardDescription>
                Drag and drop team members to reorder them or move them between groups. Drag groups to reorder them.
              </CardDescription>
            </div>
            {isUpdating && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                Updating...
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Team Groups */}
          {teamGroups.map((group, groupIndex) => (
            <div
              key={group.id}
              draggable
              onDragStart={() => handleGroupDragStart(group)}
              onDragOver={(e) => handleGroupDragOver(e, groupIndex)}
              onDragEnd={handleGroupDragEnd}
              onDrop={(e) => {
                e.stopPropagation();
                handleGroupDrop(groupIndex);
              }}
              className={`border rounded-lg p-4 bg-muted/30 transition-all duration-200 ${draggedGroup?.id === group.id ? 'opacity-50 scale-95' : ''
                } ${isUpdating ? 'pointer-events-none' : ''}`}
              style={{
                transform: draggedGroup?.id === group.id ? 'rotate(2deg)' : 'none',
              }}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <GripVertical className="h-5 w-5 text-muted-foreground cursor-grab active:cursor-grabbing" />
                  <div>
                    <h3 className="font-semibold text-lg">{group.name}</h3>
                    {group.description && (
                      <p className="text-sm text-muted-foreground">{group.description}</p>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => openEditDialog(group)}
                    disabled={isUpdating}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDeleteGroup(group.id)}
                    disabled={isUpdating}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                {getMembersInGroup(group.id).map((member, memberIndex) => (
                  <div
                    key={member.id}
                    draggable
                    onDragStart={() => handleMemberDragStart(member)}
                    onDragOver={(e) => handleMemberDragOver(e, group.id, memberIndex)}
                    onDragEnd={handleMemberDragEnd}
                    onDrop={(e) => {
                      e.stopPropagation();
                      handleMemberDrop(group.id, memberIndex);
                    }}
                    className={`flex items-center gap-3 p-3 bg-background border rounded-lg cursor-move transition-all duration-200 ${draggedMember?.id === member.id
                      ? 'opacity-50 scale-95 rotate-2'
                      : 'hover:border-primary hover:shadow-md'
                      } ${isUpdating ? 'pointer-events-none' : ''}`}
                  >
                    <GripVertical className="h-4 w-4 text-muted-foreground" />
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={member.image} alt={member.name} />
                      <AvatarFallback>{member.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="font-medium">{member.name}</p>
                      <p className="text-sm text-muted-foreground">{member.role}</p>
                    </div>
                     <div className="flex items-center gap-1">
                        <Button size="icon" variant="ghost" asChild>
                            <Link href={`/manage/team/${member.id}/edit`}>
                                <Pencil className="h-4 w-4" />
                            </Link>
                        </Button>
                        <DeleteTeamMemberDialog member={member}>
                            <Button size="icon" variant="ghost">
                                <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                        </DeleteTeamMemberDialog>
                    </div>
                  </div>
                ))}

                {/* Drop zone for adding members to this group */}
                <div
                  onDragOver={(e) => handleMemberDragOver(e, group.id, getMembersInGroup(group.id).length)}
                  onDrop={(e) => {
                    e.stopPropagation();
                    handleMemberDrop(group.id, getMembersInGroup(group.id).length);
                  }}
                  className={`border-2 border-dashed rounded-lg p-4 text-center text-sm transition-all duration-200 ${dragOverGroupId === group.id && draggedMember
                    ? 'border-primary bg-primary/10 text-primary scale-105'
                    : 'border-muted-foreground/20 text-muted-foreground hover:border-primary/50'
                    }`}
                >
                  {dragOverGroupId === group.id && draggedMember
                    ? `Drop ${draggedMember.name} here`
                    : `Drop member here to add to ${group.name}`}
                </div>
              </div>
            </div>
          ))}

          {/* Ungrouped Members */}
          <div className={`border rounded-lg p-4 transition-all duration-200 ${dragOverGroupId === null && draggedMember ? 'border-primary bg-primary/5' : ''
              }`}>
              <h3 className="font-semibold text-lg mb-4">Ungrouped Members</h3>
              <div className="space-y-2">
                {ungroupedMembers.map((member, memberIndex) => (
                  <div
                    key={member.id}
                    draggable
                    onDragStart={() => handleMemberDragStart(member)}
                    onDragOver={(e) => handleMemberDragOver(e, null, memberIndex)}
                    onDragEnd={handleMemberDragEnd}
                    onDrop={(e) => {
                      e.stopPropagation();
                      handleMemberDrop(null, memberIndex);
                    }}
                    className={`flex items-center gap-3 p-3 bg-background border rounded-lg cursor-move transition-all duration-200 ${draggedMember?.id === member.id
                      ? 'opacity-50 scale-95 rotate-2'
                      : 'hover:border-primary hover:shadow-md'
                      } ${isUpdating ? 'pointer-events-none' : ''}`}
                  >
                    <GripVertical className="h-4 w-4 text-muted-foreground" />
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={member.image} alt={member.name} />
                      <AvatarFallback>{member.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="font-medium">{member.name}</p>
                      <p className="text-sm text-muted-foreground">{member.role}</p>
                    </div>
                     <div className="flex items-center gap-1">
                        <Button size="icon" variant="ghost" asChild>
                            <Link href={`/manage/team/${member.id}/edit`}>
                                <Pencil className="h-4 w-4" />
                            </Link>
                        </Button>
                        <DeleteTeamMemberDialog member={member}>
                            <Button size="icon" variant="ghost">
                                <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                        </DeleteTeamMemberDialog>
                    </div>
                  </div>
                ))}
                 {/* Drop zone for ungrouped */}
                 <div
                  onDragOver={(e) => handleMemberDragOver(e, null, getMembersInGroup(null).length)}
                  onDrop={(e) => {
                    e.stopPropagation();
                    handleMemberDrop(null, getMembersInGroup(null).length);
                  }}
                  className={`border-2 border-dashed rounded-lg p-4 text-center text-sm transition-all duration-200 ${dragOverGroupId === null && draggedMember
                    ? 'border-primary bg-primary/10 text-primary scale-105'
                    : 'border-muted-foreground/20 text-muted-foreground hover:border-primary/50'
                    }`}
                >
                  {dragOverGroupId === null && draggedMember
                    ? `Drop ${draggedMember.name} here`
                    : 'Drop member here to ungroup'}
                </div>
              </div>
            </div>

          {teamGroups.length === 0 && ungroupedMembers.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No team members yet. Create a group or add members to get started.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Group Dialog */}
      <Dialog open={isGroupDialogOpen} onOpenChange={setIsGroupDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingGroup ? 'Edit Group' : 'Create New Group'}</DialogTitle>
            <DialogDescription>
              {editingGroup ? 'Update the group details below.' : 'Create a new team group to organize your members.'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="groupName">Group Name</Label>
              <Input
                id="groupName"
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
                placeholder="e.g., Management Team"
                disabled={isUpdating}
              />
            </div>
            <div>
              <Label htmlFor="groupDescription">Description (Optional)</Label>
              <Input
                id="groupDescription"
                value={newGroupDescription}
                onChange={(e) => setNewGroupDescription(e.target.value)}
                placeholder="Brief description of this team"
                disabled={isUpdating}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsGroupDialogOpen(false)}
              disabled={isUpdating}
            >
              Cancel
            </Button>
            <Button
              onClick={editingGroup ? handleUpdateGroup : handleCreateGroup}
              disabled={isUpdating || !newGroupName.trim()}
            >
              {isUpdating ? 'Saving...' : (editingGroup ? 'Update' : 'Create')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

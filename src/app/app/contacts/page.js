'use client';

import { useAuth } from '@/components/providers/SupabaseAuthProvider';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { ArrowLeft, Plus, Trash2, Send } from 'lucide-react';
import { toast } from 'sonner';

export default function ContactsPage() {
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const router = useRouter();
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    type: 'ADDRESS',
    value: '',
    linkedAddress: '',
    notes: ''
  });

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/auth/signin');
    } else if (isAuthenticated) {
      fetchContacts();
    }
  }, [authLoading, isAuthenticated, router]);

  const fetchContacts = async () => {
    try {
      const res = await fetch('/api/contacts');
      if (res.ok) {
        const data = await res.json();
        setContacts(data.contacts || []);
      }
    } catch (error) {
      console.error('Error fetching contacts:', error);
      toast.error('Failed to load contacts');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch('/api/contacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (res.ok) {
        toast.success('Contact added successfully!');
        setShowAddDialog(false);
        setFormData({ name: '', type: 'ADDRESS', value: '', linkedAddress: '', notes: '' });
        fetchContacts();
      } else {
        const error = await res.json();
        toast.error(error.error || 'Failed to add contact');
      }
    } catch (error) {
      console.error('Error adding contact:', error);
      toast.error('Failed to add contact');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this contact?')) return;

    try {
      const res = await fetch(`/api/contacts/${id}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success('Contact deleted');
        fetchContacts();
      } else {
        toast.error('Failed to delete contact');
      }
    } catch (error) {
      console.error('Error deleting contact:', error);
      toast.error('Failed to delete contact');
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin text-4xl">⚡</div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) return null;

  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b border-border">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/app" className="flex items-center gap-2 text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Link>
          <Badge variant="secondary" className="bg-amber-500/10 text-amber-400 border-amber-500/20">
            🧪 Sandbox Mode
          </Badge>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Contacts</h1>
            <p className="text-muted-foreground">Manage your saved recipients</p>
          </div>
          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Contact
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Contact</DialogTitle>
                <DialogDescription>
                  Save recipient details for quick sending
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label>Contact Name</Label>
                  <Input
                    placeholder="John Doe"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Type</Label>
                  <Select value={formData.type} onValueChange={(val) => setFormData({ ...formData, type: val })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ADDRESS">Wallet Address</SelectItem>
                      <SelectItem value="PHONE">Phone Number</SelectItem>
                      <SelectItem value="ENS">ENS Name</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>{formData.type === 'PHONE' ? 'Phone Number' : formData.type === 'ENS' ? 'ENS Name' : 'Wallet Address'}</Label>
                  <Input
                    placeholder={formData.type === 'PHONE' ? '+91 98765 43210' : formData.type === 'ENS' ? 'vitalik.eth' : '0x...'}
                    value={formData.value}
                    onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                    required
                  />
                </div>
                {formData.type !== 'ADDRESS' && (
                  <div className="space-y-2">
                    <Label>Linked Wallet Address (Optional)</Label>
                    <Input
                      placeholder="0x..."
                      value={formData.linkedAddress}
                      onChange={(e) => setFormData({ ...formData, linkedAddress: e.target.value })}
                    />
                  </div>
                )}
                <div className="space-y-2">
                  <Label>Notes (Optional)</Label>
                  <Input
                    placeholder="Family member, business partner, etc."
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? 'Adding...' : 'Add Contact'}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {contacts.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground mb-4">No contacts yet</p>
              <Button onClick={() => setShowAddDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Your First Contact
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {contacts.map((contact) => (
              <Card key={contact.id}>
                <CardContent className="py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-lg">{contact.name}</h3>
                        <Badge variant="outline">{contact.type}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground font-mono">{contact.value}</p>
                      {contact.notes && (
                        <p className="text-sm text-muted-foreground mt-1">{contact.notes}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Link href={`/app/send?contact=${contact.id}`}>
                        <Button size="sm">
                          <Send className="h-4 w-4 mr-1" />
                          Send
                        </Button>
                      </Link>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDelete(contact.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
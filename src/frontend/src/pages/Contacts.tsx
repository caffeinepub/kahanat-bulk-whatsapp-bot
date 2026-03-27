import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Search, Trash2, Upload, UserPlus, Users } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import * as XLSX from "xlsx";
import {
  useAddContact,
  useBulkImportContacts,
  useContacts,
  useDeleteContact,
} from "../hooks/useQueries";

export function Contacts() {
  const { data: contacts = [], isLoading } = useContacts();
  const addContact = useAddContact();
  const deleteContact = useDeleteContact();
  const bulkImport = useBulkImportContacts();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [search, setSearch] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const filtered = contacts.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.phone.includes(search),
  );

  const handleAdd = async () => {
    if (!phone.trim()) {
      toast.error("Phone number is required");
      return;
    }
    const finalName = name.trim() || `Customer ${contacts.length + 1}`;
    try {
      await addContact.mutateAsync({ name: finalName, phone: phone.trim() });
      toast.success(`Contact "${finalName}" added`);
      setName("");
      setPhone("");
    } catch {
      toast.error("Failed to add contact");
    }
  };

  const handleDelete = async (id: bigint) => {
    try {
      await deleteContact.mutateAsync(id);
      toast.success("Contact deleted");
    } catch {
      toast.error("Failed to delete contact");
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const buffer = await file.arrayBuffer();
      const wb = XLSX.read(buffer, { type: "array" });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const rows: string[][] = XLSX.utils.sheet_to_json(ws, { header: 1 });
      const entries: Array<[string, string]> = [];
      let autoIdx = contacts.length + 1;
      for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        if (!row || row.length < 1) continue;
        const rawName = String(row[0] ?? "").trim();
        const rawPhone = String(row[1] ?? "").trim();
        if (!rawPhone) continue;
        const finalName = rawName || `Customer ${autoIdx++}`;
        entries.push([finalName, rawPhone]);
      }
      if (entries.length === 0) {
        toast.error("No valid contacts found in file");
        return;
      }
      await bulkImport.mutateAsync(entries);
      toast.success(`${entries.length} contacts imported successfully`);
    } catch {
      toast.error("Failed to parse file");
    } finally {
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Contact Management</h1>
          <p className="text-sm text-muted-foreground">
            Manage your WhatsApp contacts
          </p>
        </div>
        <Badge
          className="bg-primary/10 text-primary border-primary/20"
          data-ocid="contacts.count.badge"
        >
          <Users className="w-3 h-3 mr-1" />
          {contacts.length.toLocaleString()} contacts
        </Badge>
      </div>

      <Card
        className="bg-card border-border card-glow"
        data-ocid="contacts.add.card"
      >
        <CardHeader>
          <CardTitle className="text-sm font-semibold">
            Add New Contact
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs">Name (optional)</Label>
              <Input
                data-ocid="contacts.name.input"
                placeholder="e.g. Customer 1 (auto-filled if blank)"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="bg-secondary border-border text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">
                Phone Number (with country code)
              </Label>
              <Input
                data-ocid="contacts.phone.input"
                placeholder="e.g. +601234567890"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="bg-secondary border-border text-sm"
                onKeyDown={(e) => e.key === "Enter" && handleAdd()}
              />
            </div>
          </div>
          <div className="flex gap-3">
            <Button
              data-ocid="contacts.add.primary_button"
              onClick={handleAdd}
              disabled={addContact.isPending}
              className="bg-primary text-primary-foreground"
            >
              <UserPlus className="w-4 h-4 mr-2" />
              {addContact.isPending ? "Saving..." : "Save Contact"}
            </Button>
            <Button
              data-ocid="contacts.upload.button"
              variant="outline"
              onClick={() => fileRef.current?.click()}
              disabled={bulkImport.isPending}
              className="border-border"
            >
              <Upload className="w-4 h-4 mr-2" />
              {bulkImport.isPending ? "Importing..." : "Upload Excel/CSV"}
            </Button>
            <input
              ref={fileRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              className="hidden"
              onChange={handleFileUpload}
            />
          </div>
          <p className="text-[11px] text-muted-foreground">
            Excel format: Column A = Name (optional), Column B = Phone number.
            Row 1 = headers (skipped).
          </p>
        </CardContent>
      </Card>

      <Card
        className="bg-card border-border card-glow"
        data-ocid="contacts.list.card"
      >
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold">
              All Contacts
            </CardTitle>
            <div className="relative w-64">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <Input
                data-ocid="contacts.search.search_input"
                placeholder="Search contacts..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8 bg-secondary border-border text-sm h-8"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div
              className="p-4 text-sm text-muted-foreground"
              data-ocid="contacts.list.loading_state"
            >
              Loading contacts...
            </div>
          ) : filtered.length === 0 ? (
            <div
              className="p-8 text-center"
              data-ocid="contacts.list.empty_state"
            >
              <Users className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">
                {search
                  ? "No contacts match your search"
                  : "No contacts yet. Add your first contact above."}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-border">
                    <TableHead className="text-xs w-10">#</TableHead>
                    <TableHead className="text-xs">Contact</TableHead>
                    <TableHead className="text-xs">Phone</TableHead>
                    <TableHead className="text-xs">Added</TableHead>
                    <TableHead className="text-xs w-10" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((contact, i) => (
                    <TableRow
                      key={String(contact.id)}
                      className="border-border"
                      data-ocid={`contacts.list.item.${i + 1}`}
                    >
                      <TableCell className="text-xs text-muted-foreground">
                        {i + 1}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center text-xs font-semibold text-primary flex-shrink-0">
                            {contact.name.charAt(0).toUpperCase()}
                          </div>
                          <span className="text-sm font-medium">
                            {contact.name}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground font-mono">
                        {contact.phone}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {new Date(
                          Number(contact.createdAt) / 1_000_000,
                        ).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="w-7 h-7 text-muted-foreground hover:text-destructive"
                          onClick={() => handleDelete(contact.id)}
                          data-ocid={`contacts.delete_button.${i + 1}`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

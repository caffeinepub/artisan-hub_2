import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import type { DescriptionTemplate } from "../backend";
import {
  useCreateDescriptionTemplate,
  useUpdateDescriptionTemplate,
} from "../hooks/useQueries";

interface DescriptionTemplateEditorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  template?: DescriptionTemplate | null;
}

export default function DescriptionTemplateEditor({
  open,
  onOpenChange,
  template,
}: DescriptionTemplateEditorProps) {
  const [name, setName] = useState("");
  const [content, setContent] = useState("");
  const createTemplate = useCreateDescriptionTemplate();
  const updateTemplate = useUpdateDescriptionTemplate();

  const isEditMode = !!template;

  // biome-ignore lint/correctness/useExhaustiveDependencies: open is intentionally used to reset form when dialog closes
  useEffect(() => {
    if (template) {
      setName(template.name);
      setContent(template.content);
    } else {
      setName("");
      setContent("");
    }
  }, [template, open]);

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error("Please enter a template name");
      return;
    }

    if (!content.trim()) {
      toast.error("Please enter template content");
      return;
    }

    try {
      if (isEditMode && template) {
        await updateTemplate.mutateAsync({
          id: template.id,
          name: name.trim(),
          content: content.trim(),
        });
        toast.success("Template updated successfully");
      } else {
        await createTemplate.mutateAsync({
          name: name.trim(),
          content: content.trim(),
        });
        toast.success("Template created successfully");
      }
      onOpenChange(false);
    } catch (error) {
      toast.error(
        isEditMode ? "Failed to update template" : "Failed to create template",
      );
      console.error("Save template error:", error);
    }
  };

  const handleCancel = () => {
    onOpenChange(false);
  };

  const isSaving = createTemplate.isPending || updateTemplate.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>
            {isEditMode ? "Edit Template" : "Create New Template"}
          </DialogTitle>
          <DialogDescription>
            {isEditMode
              ? "Update the template name and content below."
              : "Create a new description template for your products."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="template-name">Template Name</Label>
            <Input
              id="template-name"
              placeholder="e.g., Default Product Description"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isSaving}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="template-content">Template Content</Label>
            <Textarea
              id="template-content"
              placeholder="Enter the description template text..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              disabled={isSaving}
              rows={8}
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground">
              This text will be used as the default description for products
              during bulk upload.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleCancel} disabled={isSaving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving
              ? "Saving..."
              : isEditMode
                ? "Update Template"
                : "Create Template"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

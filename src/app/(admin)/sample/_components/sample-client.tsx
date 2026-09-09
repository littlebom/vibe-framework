"use client";

import { useState, useTransition } from "react";
import { Plus, Edit2, Trash2, Layers, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { useT, useLocale } from "@/shared/lib/i18n/client";
import { formatDate } from "@/shared/lib/format";
import {
  LiyonCard,
  DataTable,
  StatusPill,
  LiyonDialog,
  LiyonDialogHeader,
  LiyonDialogBody,
  LiyonDialogFooter,
  LiyonField,
  LiyonSelect,
  RowMenuItem,
  type DataTableColumn,
} from "@/shared/components/liyon";
import { Button } from "@/components/ui/button";
import type { SampleItemDto } from "@/features/sample";
import {
  createSampleItemAction,
  updateSampleItemAction,
  deleteSampleItemAction,
  getSampleItemsAction,
} from "@/features/sample/actions";

interface Props {
  initialItems: SampleItemDto[];
  canManage: boolean;
}

export function SampleClient({ initialItems, canManage }: Props) {
  const t = useT();
  const locale = useLocale();
  const [items, setItems] = useState<SampleItemDto[]>(initialItems);
  const [isPending, startTransition] = useTransition();

  // Dialog states
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteConfirmItem, setDeleteConfirmItem] = useState<SampleItemDto | null>(null);
  const [editingItem, setEditingItem] = useState<SampleItemDto | null>(null);
  const [formTitle, setFormTitle] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formStatus, setFormStatus] = useState<"ACTIVE" | "INACTIVE">("ACTIVE");

  const openCreateDialog = () => {
    setEditingItem(null);
    setFormTitle("");
    setFormDescription("");
    setFormStatus("ACTIVE");
    setModalOpen(true);
  };

  const openEditDialog = (item: SampleItemDto) => {
    setEditingItem(item);
    setFormTitle(item.title);
    setFormDescription(item.description ?? "");
    setFormStatus(item.status as "ACTIVE" | "INACTIVE");
    setModalOpen(true);
  };

  const refreshItems = async () => {
    const res = await getSampleItemsAction();
    if (res.ok) {
      setItems(res.data);
    }
  };

  const handleSave = () => {
    if (!formTitle.trim()) {
      toast.error(t("error.validation"));
      return;
    }

    startTransition(async () => {
      if (editingItem) {
        const res = await updateSampleItemAction({
          id: editingItem.id,
          title: formTitle.trim(),
          description: formDescription.trim() || undefined,
          status: formStatus,
        });
        if (res.ok) {
          toast.success(t("sample.updateSuccess"));
          setModalOpen(false);
          await refreshItems();
        } else {
          toast.error(t("common.error"));
        }
      } else {
        const res = await createSampleItemAction({
          title: formTitle.trim(),
          description: formDescription.trim() || undefined,
          status: formStatus,
        });
        if (res.ok) {
          toast.success(t("sample.createSuccess"));
          setModalOpen(false);
          await refreshItems();
        } else {
          toast.error(t("common.error"));
        }
      }
    });
  };

  const handleDelete = (item: SampleItemDto) => {
    startTransition(async () => {
      const res = await deleteSampleItemAction(item.id);
      if (res.ok) {
        toast.success(t("sample.deleteSuccess"));
        setDeleteConfirmItem(null);
        await refreshItems();
      } else {
        toast.error(t("common.error"));
      }
    });
  };

  const columns: DataTableColumn<SampleItemDto>[] = [
    {
      key: "title",
      header: t("sample.titleField"),
      render: (row) => <span className="font-medium text-foreground">{row.title}</span>,
    },
    {
      key: "description",
      header: t("sample.descField"),
      render: (row) => <span className="text-muted-foreground text-sm">{row.description || "—"}</span>,
    },
    {
      key: "status",
      header: t("sample.statusField"),
      render: (row) => (
        <StatusPill tone={row.status === "ACTIVE" ? "success" : "neutral"}>
          {row.status === "ACTIVE" ? t("status.active") : t("status.inactive")}
        </StatusPill>
      ),
    },
    {
      key: "createdAt",
      header: t("common.actions"),
      className: "nowrap text-muted-foreground text-xs",
      render: (row) => <span>{formatDate(new Date(row.createdAt), locale)}</span>,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t("sample.title")}</h1>
          <p className="text-sm text-muted-foreground">{t("sample.subtitle")}</p>
        </div>
        {canManage && (
          <Button onClick={openCreateDialog} className="gap-2">
            <Plus className="h-4 w-4" />
            {t("sample.create")}
          </Button>
        )}
      </div>

      <LiyonCard>
        <DataTable<SampleItemDto>
          state={items.length === 0 ? "empty" : "data"}
          rows={items}
          columns={columns}
          getRowId={(row) => row.id}
          renderRowMenu={
            canManage
              ? (row) => (
                  <>
                    <RowMenuItem onClick={() => openEditDialog(row)} icon={<Edit2 className="h-4 w-4" />}>
                      {t("sample.edit")}
                    </RowMenuItem>
                    <RowMenuItem onClick={() => setDeleteConfirmItem(row)} destructive icon={<Trash2 className="h-4 w-4" />}>
                      {t("sample.delete")}
                    </RowMenuItem>
                  </>
                )
              : undefined
          }
          empty={{
            icon: <Layers className="h-10 w-10 text-muted-foreground/50" />,
            title: t("sample.empty"),
            description: t("sample.subtitle"),
          }}
          error={{
            icon: <AlertCircle className="h-10 w-10 text-destructive" />,
            title: t("common.error"),
          }}
        />
      </LiyonCard>

      {/* Dialog สร้าง/แก้ไขข้อมูล */}
      <LiyonDialog open={modalOpen} onOpenChange={setModalOpen} size="md">
        <LiyonDialogHeader
          title={editingItem ? t("sample.edit") : t("sample.create")}
          description={t("sample.subtitle")}
          onClose={() => setModalOpen(false)}
        />
        <LiyonDialogBody>
          <div className="space-y-4 py-2">
            <LiyonField
              label={t("sample.titleField")}
              required
              inputProps={{
                value: formTitle,
                onChange: (e) => setFormTitle(e.target.value),
                placeholder: "เช่น ข้อมูลทดสอบ 1",
              }}
            />
            <LiyonField
              label={t("sample.descField")}
              inputProps={{
                value: formDescription,
                onChange: (e) => setFormDescription(e.target.value),
                placeholder: "รายละเอียดเพิ่มเติม...",
              }}
            />
            <LiyonSelect
              label={t("sample.statusField")}
              value={formStatus}
              onChange={(e) => setFormStatus(e.target.value as "ACTIVE" | "INACTIVE")}
              options={[
                { value: "ACTIVE", label: t("status.active") },
                { value: "INACTIVE", label: t("status.inactive") },
              ]}
            />
          </div>
        </LiyonDialogBody>
        <LiyonDialogFooter>
          <Button variant="outline" onClick={() => setModalOpen(false)} disabled={isPending}>
            {t("sample.cancel")}
          </Button>
          <Button onClick={handleSave} disabled={isPending}>
            {t("sample.save")}
          </Button>
        </LiyonDialogFooter>
      </LiyonDialog>

      {/* Dialog ยืนยันการลบ */}
      <LiyonDialog open={!!deleteConfirmItem} onOpenChange={(open) => !open && setDeleteConfirmItem(null)} size="sm">
        <LiyonDialogHeader
          title={t("sample.delete")}
          description={t("sample.deleteConfirm")}
          onClose={() => setDeleteConfirmItem(null)}
        />
        <LiyonDialogBody>
          <p className="text-sm text-muted-foreground">
            {deleteConfirmItem?.title}
          </p>
        </LiyonDialogBody>
        <LiyonDialogFooter>
          <Button variant="outline" onClick={() => setDeleteConfirmItem(null)} disabled={isPending}>
            {t("sample.cancel")}
          </Button>
          <Button
            variant="destructive"
            onClick={() => deleteConfirmItem && handleDelete(deleteConfirmItem)}
            disabled={isPending}
          >
            {t("sample.delete")}
          </Button>
        </LiyonDialogFooter>
      </LiyonDialog>
    </div>
  );
}

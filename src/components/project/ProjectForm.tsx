import { useState } from "react";
import type { FormEvent } from "react";

import type {
  Project,
  ProjectPriority,
  ProjectStatus,
} from "@shared/projects/model";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";

export type ProjectFormData = {
  name: string;
  description: string;
  status: ProjectStatus;
  priority: ProjectPriority;
  ownerUuid: string;
  dueDate: string | null;
};

type ProjectFormProps = {
  project?: Project;
  onSubmit: (formData: ProjectFormData) => void;
  onCancel: () => void;
};

const projectStatuses = [
  { value: "BACKLOG", label: "Backlog" },
  { value: "ACTIVE", label: "Active" },
  { value: "BLOCKED", label: "Blocked" },
  { value: "COMPLETED", label: "Completed" },
];

const projectPriorities = [
  { value: "LOW", label: "Low" },
  { value: "MEDIUM", label: "Medium" },
  { value: "HIGH", label: "High" },
  { value: "CRITICAL", label: "Critical" },
];

export const ProjectForm = ({
  project,
  onSubmit,
  onCancel,
}: ProjectFormProps) => {
  const isEditing = !!project;

  const [name, setName] = useState(project?.name ?? "");
  const [description, setDescription] = useState(project?.description ?? "");
  const [status, setStatus] = useState<ProjectStatus>(
    project?.status ?? "BACKLOG",
  );
  const [priority, setPriority] = useState<ProjectPriority>(
    project?.priority ?? "MEDIUM",
  );
  const [ownerUuid, setOwnerUuid] = useState(project?.ownerUuid ?? "");
  const [dueDate, setDueDate] = useState(project?.dueDate ?? "");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    try {
      await onSubmit({
        name,
        description,
        status,
        priority,
        ownerUuid,
        dueDate: dueDate || null,
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={onCancel}
    >
      <div
        className="w-full max-w-lg rounded-lg bg-white p-relaxed shadow-xl"
        onClick={(event) => {
          return event.stopPropagation();
        }}
      >
        <h2 className="mb-normal text-lg font-semibold text-gray-900">
          {isEditing ? "Edit Project" : "New Project"}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Name"
            id="name"
            type="text"
            value={name}
            required
            onChange={(event) => {
              return setName(event.target.value);
            }}
          />

          <Textarea
            label="Description"
            id="description"
            rows={3}
            value={description}
            required
            onChange={(event) => {
              return setDescription(event.target.value);
            }}
          />

          <div className="grid grid-cols-2 gap-normal">
            <Select
              label="Status"
              id="status"
              options={projectStatuses}
              value={status}
              onChange={(event) => {
                return setStatus(event.target.value as ProjectStatus);
              }}
            />
            <Select
              label="Priority"
              id="priority"
              options={projectPriorities}
              value={priority}
              onChange={(event) => {
                return setPriority(event.target.value as ProjectPriority);
              }}
            />
          </div>

          <div className="grid grid-cols-2 gap-normal">
            <Input
              label="Owner ID"
              id="ownerUuid"
              type="text"
              value={ownerUuid}
              required
              onChange={(event) => {
                return setOwnerUuid(event.target.value);
              }}
            />
            <Input
              label="Due Date"
              id="dueDate"
              type="date"
              value={dueDate}
              onChange={(event) => {
                return setDueDate(event.target.value);
              }}
            />
          </div>

          <div className="flex justify-end gap-3 pt-small">
            <Button
              type="button"
              onClick={onCancel}
              variant="secondary"
              text="Cancel"
            />
            <Button
              type="submit"
              variant="primary"
              text={
                submitting ? "Saving..." : isEditing ? "Save" : "Create Project"
              }
              disabled={submitting}
            />
          </div>
        </form>
      </div>
    </div>
  );
};

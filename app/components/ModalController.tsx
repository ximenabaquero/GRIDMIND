"use client";
import { useUIStore } from "@/app/store/uiStore";
import { Modal } from "./Modal";
import { PracticeModal } from "@/app/features/practice/PracticeModal";
import { TasksModal } from "@/app/features/tasks/TasksModal";
import { TrackForm } from "@/app/features/tracks/TrackForm";

export function ModalController() {
  const { modal, closeModal } = useUIStore();

  return (
    <>
      {/* Practice modal */}
      <Modal
        open={modal?.kind === "practice"}
        onClose={closeModal}
        title={modal?.kind === "practice" ? modal.track.name : undefined}
      >
        {modal?.kind === "practice" && (
          <PracticeModal track={modal.track} cell={modal.cell} />
        )}
      </Modal>

      {/* Tasks modal */}
      <Modal
        open={modal?.kind === "tasks"}
        onClose={closeModal}
        title={modal?.kind === "tasks" ? modal.track.name : undefined}
      >
        {modal?.kind === "tasks" && (
          <TasksModal track={modal.track} cell={modal.cell} />
        )}
      </Modal>

      {/* Add track modal */}
      <Modal open={modal?.kind === "addTrack"} onClose={closeModal} title="New track">
        {modal?.kind === "addTrack" && <TrackForm />}
      </Modal>

      {/* Edit track modal */}
      <Modal
        open={modal?.kind === "editTrack"}
        onClose={closeModal}
        title="Edit track"
      >
        {modal?.kind === "editTrack" && <TrackForm existing={modal.track} />}
      </Modal>
    </>
  );
}

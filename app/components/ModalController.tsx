"use client";
import { useUIStore } from "@/app/store/uiStore";
import { Modal } from "./Modal";
import { PracticeModal } from "@/app/features/practice/PracticeModal";
import { TasksModal } from "@/app/features/tasks/TasksModal";
import { TrackTasksModal } from "@/app/features/tasks/TrackTasksModal";
import { TrackForm } from "@/app/features/tracks/TrackForm";
import { BossResultModal } from "@/app/features/boss/BossResultModal";

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

      {/* Track tasks overview modal */}
      <Modal
        open={modal?.kind === "trackTasks"}
        onClose={closeModal}
        title={modal?.kind === "trackTasks" ? `${modal.track.icon} ${modal.track.name}` : undefined}
      >
        {modal?.kind === "trackTasks" && (
          <TrackTasksModal track={modal.track} weekId={modal.weekId} />
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

      {/* Boss result modal */}
      <Modal
        open={modal?.kind === "bossResult"}
        onClose={closeModal}
        title={
          modal?.kind === "bossResult"
            ? modal.data.won
              ? "Batalla semanal"
              : "Batalla semanal"
            : undefined
        }
      >
        {modal?.kind === "bossResult" && <BossResultModal data={modal.data} />}
      </Modal>
    </>
  );
}

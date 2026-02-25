import React, { useEffect, useState, useMemo } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { Modal, Button, Alert } from "@sarradahub/design-system";
import FormInput from "@/shared/components/modal/FormInput";
import { useModalForm } from "@/shared/hooks/useModalForm";
import { Round } from "@/types";

interface EditRoundModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (id: number, data: { name: string; round_date: string }) => Promise<void>;
  round: Round | null;
}

interface RoundFormState extends Record<string, unknown> {
  name: string;
  round_date: string;
}

const EditRoundModal = ({
  isOpen,
  onClose,
  onUpdate,
  round,
}: EditRoundModalProps) => {
  const DatePickerComponent = DatePicker as unknown as React.ComponentType<
    React.ComponentProps<typeof DatePicker> & { style?: React.CSSProperties }
  >;
  const {
    formData,
    setFormData,
    handleChange,
    handleSubmit,
    error,
    isSubmitting,
    resetForm,
  } = useModalForm<RoundFormState>({
    name: "",
    round_date: "",
  });

  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  useEffect(() => {
    if (isOpen && round) {
      const roundDate = round.round_date ? new Date(round.round_date) : null;
      setFormData({
        name: round.name || "",
        round_date: round.round_date || "",
      });
      setSelectedDate(roundDate);
    } else if (!isOpen) {
      resetForm();
      setSelectedDate(null);
    }
  }, [isOpen, round, setFormData, resetForm]);

  const minDate = useMemo(() => new Date(), []);

  const handleDateChange = (date: Date | null) => {
    setSelectedDate(date);
    setFormData({
      ...formData,
      round_date: date ? date.toISOString() : "",
    });
  };

  const handleClose = () => {
    resetForm();
    setSelectedDate(null);
    onClose();
  };

  if (!round) return null;

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Editar Rodada">
      <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        <form
          id="edit-round-form"
          onSubmit={(event) =>
            handleSubmit(async (payload) => {
              await onUpdate(round.id, {
                name: payload.name,
                round_date: payload.round_date,
              });
            }, event)
          }
        >
          <FormInput
            label="Nome da Rodada"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="Ex: 1ª Rodada"
            required
          />
          <div style={{ marginBottom: "1.5rem" }}>
            <label htmlFor="round-date-picker" style={{ marginBottom: "0.5rem", display: "block", fontSize: "0.875rem", fontWeight: 500, color: "#404040" }}>
              Data da Rodada *
            </label>
            <DatePickerComponent
              id="round-date-picker"
              selected={selectedDate}
              onChange={handleDateChange}
              minDate={minDate}
              dateFormat="dd/MM/yyyy"
              required
              style={{ width: "100%", padding: "0.5rem", borderRadius: "0.375rem", border: "1px solid #d1d5db" }}
            />
          </div>
          {error && <Alert variant="error">{error}</Alert>}
        </form>
        <div style={{ marginTop: "1.5rem", display: "flex", justifyContent: "flex-end", gap: "0.75rem" }}>
          <Button
            type="button"
            variant="secondary"
            onClick={handleClose}
            disabled={isSubmitting}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            variant="primary"
            form="edit-round-form"
            loading={isSubmitting}
            disabled={isSubmitting}
          >
            Salvar Alterações
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default EditRoundModal;

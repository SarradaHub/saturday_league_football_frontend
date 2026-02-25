import React, { useEffect, useMemo, useState } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { Modal, Button, Alert, Label } from "@sarradahub/design-system";
import FormInput from "@/shared/components/modal/FormInput";
import { useModalForm } from "@/shared/hooks/useModalForm";

interface CreateRoundFormData {
  name: string;
  round_date: string;
  championship_id: number;
  [key: string]: string | number;
}

interface CreateRoundModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (formData: CreateRoundFormData) => Promise<void>;
  initialChampionshipId?: number;
}

const CreateRoundModal = ({
  isOpen,
  onClose,
  onCreate,
  initialChampionshipId = 0,
}: CreateRoundModalProps) => {
  const DatePickerComponent = DatePicker as React.ComponentType<
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
  } = useModalForm<CreateRoundFormData>({
    name: "",
    round_date: "",
    championship_id: initialChampionshipId,
  });

  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  useEffect(() => {
    if (initialChampionshipId) {
      setFormData((prev: CreateRoundFormData) => ({
        ...prev,
        championship_id: initialChampionshipId,
      }));
    }
  }, [initialChampionshipId, setFormData]);

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

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Criar Nova Rodada">
      <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        <form
          id="round-form"
          onSubmit={(event) =>
            handleSubmit(async (payload) => {
              await onCreate({
                ...payload,
                championship_id: Number(payload.championship_id),
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
            <Label htmlFor="round-date-picker" style={{ marginBottom: "0.5rem", display: "block" }}>
              Data da Rodada *
            </Label>
            <DatePickerComponent
              id="round-date-picker"
              selected={selectedDate}
              onChange={handleDateChange}
              minDate={minDate}
              dateFormat="dd/MM/yyyy"
              placeholderText="Selecione uma data"
              style={{ width: "100%", borderRadius: "0.5rem", border: "1px solid #d4d4d4", padding: "0.75rem 1rem", outline: "none" }}
              required
              popperClassName="react-datepicker-popper"
            />
          </div>
          {error && <Alert variant="error">{error}</Alert>}
        </form>
        <div style={{ marginTop: "2rem", display: "flex", justifyContent: "flex-end", gap: "0.75rem" }}>
          <Button
            type="button"
            variant="secondary"
            onClick={handleClose}
            disabled={isSubmitting}
            aria-label="Cancelar"
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            variant="primary"
            form="round-form"
            loading={isSubmitting}
            disabled={!formData.name || !formData.round_date}
            aria-label="Criar Rodada"
          >
            Criar Rodada
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default CreateRoundModal;

import { useEffect, useMemo, useState } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import BaseModal from "@/shared/components/modal/BaseModal";
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
      setFormData({
        ...formData,
        championship_id: initialChampionshipId,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    <BaseModal
      isOpen={isOpen}
      onClose={handleClose}
      title="Criar Nova Rodada"
      formId="round-form"
      isSubmitting={isSubmitting}
      submitLabel="Criar Rodada"
      submitDisabled={!formData.name || !formData.round_date}
    >
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
        <div className="mb-6">
          <label
            htmlFor="round-date-picker"
            className="mb-2 block text-sm font-medium text-gray-700"
          >
            Data da Rodada *
          </label>
          <DatePicker
            id="round-date-picker"
            selected={selectedDate}
            onChange={handleDateChange}
            minDate={minDate}
            dateFormat="dd/MM/yyyy"
            placeholderText="Selecione uma data"
            className="w-full rounded-lg border px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
            required
            popperClassName="react-datepicker-popper"
          />
        </div>
        {error && (
          <div className="mb-6 rounded-lg border border-red-100 bg-red-50 p-3">
            <span className="text-sm text-red-600">{error}</span>
          </div>
        )}
      </form>
    </BaseModal>
  );
};

export default CreateRoundModal;

// Defina uma interface para as props
interface TagButtonProps {
  label: string;
  selected: boolean;
  onClick: () => void;  // Função sem parâmetros
}

export default function TagButton({ label, selected, onClick }: TagButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1 text-sm rounded-full border transition-all ${
        selected
          ? "bg-green-500 text-white border-green-500"
          : "bg-white border-gray-300 text-gray-600 hover:bg-gray-100"
      }`}
    >
      {label}
    </button>
  );
}

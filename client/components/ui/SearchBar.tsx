import { Search } from "lucide-react";

// Defina uma interface para as props
interface SearchBarProps {
  value: string;
  onChange: (newValue: string) => void;  // Função que recebe o novo valor
}

export default function SearchBar({ value, onChange }: SearchBarProps) {
  return (
    <div className="flex items-center gap-2 rounded-full border border-gray-200 px-4 py-2 bg-white shadow-sm">
      <Search className="w-4 h-4 text-gray-400" />
      <input
        type="text"
        placeholder="Pesquise serviços ou barbearias"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="flex-1 text-sm focus:outline-none"
      />
    </div>
  );
}

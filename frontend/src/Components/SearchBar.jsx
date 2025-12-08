export default function SearchBar({ onChange }) {
  return (
    <input className="search" placeholder="Search songs or artist..." onChange={e => onChange(e.target.value)} />
  );
}

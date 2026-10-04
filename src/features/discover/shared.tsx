import { Pin, Search } from '../../components/icons'
import { useStore } from '../../state/store'

export function LocationTag() {
  const { state } = useStore()
  return <span className="location-tag"><Pin size={20} />{state.profile.homeBase || 'Berkeley, CA'}</span>
}

export function SearchBar({ value, onChange, onFocus, onSubmit, autoFocus }: {
  value?: string; onChange?: (v: string) => void; onFocus?: () => void; onSubmit?: (v: string) => void; autoFocus?: boolean
}) {
  return (
    <form className="search-bar" role="search" onSubmit={e => { e.preventDefault(); onSubmit?.(value ?? '') }}>
      <Search size={16} />
      <input type="search" enterKeyHint="search" placeholder="Search for any genre, artist, venue, or show" value={value ?? ''}
        onFocus={onFocus} autoFocus={autoFocus} readOnly={!onChange} aria-label="Search"
        onChange={e => onChange?.(e.target.value)} />
    </form>
  )
}

import { useCallback } from 'react';

const SchoolListItem = ({ schoolId, active, name, toggleActive, color }) => {
  const handleChange = useCallback(() => toggleActive(schoolId), [schoolId]);
  return (
    <li
      className="flex items-stretch justify-items-stretch text-sm"
      style={{ background: color }}
    >
      {/* I think the linter is wrong here — the input is a child of the label and that should
      be fine. */}
      {/* eslint-disable-next-line jsx-a11y/label-has-associated-control */}
      <label className="flex-1 px-2 py-0.5 whitespace-nowrap cursor-pointer">
        <input
          type="checkbox"
          className="mr-2"
          checked={active}
          onChange={handleChange}
        />
        {name}
      </label>
    </li>
  );
};

export default function SchoolList({
  state: { schools },
  toggleActive,
  setAllInactive,
}) {
  const handleSetAllInactive = useCallback(() => setAllInactive());

  return (
    <div className="space-y-1">
      <button
        onClick={handleSetAllInactive}
        className="border-2 border-gray-600 rounded px-2 bg-gray-200"
      >
        Deselect all
      </button>
      <ul className="divide-y divide-white bg-gray-100 shadow-lg">
        {Object.values(schools).map(({ schoolId, name, active, color }, i) => (
          <SchoolListItem
            key={schoolId}
            schoolId={schoolId}
            name={name}
            active={active}
            toggleActive={toggleActive}
            color={active ? color : undefined}
          />
        ))}
      </ul>
    </div>
  );
}


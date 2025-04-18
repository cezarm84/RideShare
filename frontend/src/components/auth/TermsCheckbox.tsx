import React, { useState } from 'react';
import TermsModal from '../ui/modal/TermsModal';

interface TermsCheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
}

const TermsCheckbox: React.FC<TermsCheckboxProps> = ({ checked, onChange }) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [hasReadTerms, setHasReadTerms] = useState(false);

  const handleCheckboxClick = (e: React.MouseEvent) => {
    e.preventDefault();
    
    // If not checked or already read terms, toggle
    if (hasReadTerms) {
      onChange(!checked);
    } else {
      // If trying to check without reading, show modal
      setModalOpen(true);
    }
  };

  return (
    <div>
      <div className="flex items-center">
        <div 
          className={`w-5 h-5 border rounded-md cursor-pointer flex items-center justify-center ${
            checked 
              ? 'bg-blue-600 border-blue-600 dark:bg-blue-600 dark:border-blue-600' 
              : 'border-gray-300 dark:border-gray-700'
          }`}
          onClick={handleCheckboxClick}
        >
          {checked && (
            <svg
              className="text-white"
              xmlns="http://www.w3.org/2000/svg"
              width="14"
              height="14"
              viewBox="0 0 14 14"
              fill="none"
            >
              <path
                d="M11.6666 3.5L5.24992 9.91667L2.33325 7"
                stroke="currentColor"
                strokeWidth="1.94437"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          )}
        </div>
        <label
          className="ml-2 text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer"
          onClick={handleCheckboxClick}
        >
          I agree to the{" "}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setModalOpen(true);
            }}
            className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 underline"
          >
            terms and conditions
          </button>
        </label>
      </div>
      
      {!checked && !hasReadTerms && (
        <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          You must read and agree to the terms and conditions to continue
        </div>
      )}
      
      <TermsModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onAgree={() => {
          setHasReadTerms(true);
          onChange(true);
          setModalOpen(false);
        }}
      />
    </div>
  );
};

export default TermsCheckbox;

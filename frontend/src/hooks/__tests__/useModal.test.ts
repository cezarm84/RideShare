import { renderHook, act } from '@testing-library/react';
import { useModal } from '../useModal';

describe('useModal Hook', () => {
  it('initializes with isOpen as false', () => {
    const { result } = renderHook(() => useModal());
    
    expect(result.current.isOpen).toBe(false);
  });

  it('opens the modal when openModal is called', () => {
    const { result } = renderHook(() => useModal());
    
    act(() => {
      result.current.openModal();
    });
    
    expect(result.current.isOpen).toBe(true);
  });

  it('closes the modal when closeModal is called', () => {
    const { result } = renderHook(() => useModal());
    
    // First open the modal
    act(() => {
      result.current.openModal();
    });
    expect(result.current.isOpen).toBe(true);
    
    // Then close it
    act(() => {
      result.current.closeModal();
    });
    expect(result.current.isOpen).toBe(false);
  });

  it('toggles the modal state when toggleModal is called', () => {
    const { result } = renderHook(() => useModal());
    
    // Initially closed
    expect(result.current.isOpen).toBe(false);
    
    // Toggle to open
    act(() => {
      result.current.toggleModal();
    });
    expect(result.current.isOpen).toBe(true);
    
    // Toggle to closed
    act(() => {
      result.current.toggleModal();
    });
    expect(result.current.isOpen).toBe(false);
  });

  it('can initialize with isOpen as true', () => {
    const { result } = renderHook(() => useModal(true));
    
    expect(result.current.isOpen).toBe(true);
  });
});

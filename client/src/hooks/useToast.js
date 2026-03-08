import { useToastContext } from '../context/ToastContext';

export default function useToast() {
  return useToastContext();
}
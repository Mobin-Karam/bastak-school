import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getRegistrationSelf,
  updateRegistrationProfile,
  uploadStudentDocument,
  completeRegistration,
} from "./api/registration.api.ts";

export function useRegistrationSelf() {
  return useQuery({
    queryKey: ["registration-self"],
    queryFn: getRegistrationSelf,
  });
}

export function useUpdateRegistrationProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateRegistrationProfile,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["registration-self"] });
    },
  });
}

export function useUploadStudentDocument() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: uploadStudentDocument,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["registration-self"] });
    },
  });
}

export function useCompleteRegistration() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: completeRegistration,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["registration-self"] });
    },
  });
}

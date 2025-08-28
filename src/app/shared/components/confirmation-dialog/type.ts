import { DialogFormData } from "@features/public-booking/components/booking-stepper/type";

export type ConfirmationDialogData = {
    title: string;
    message: string;
    confirmButtonLabel: string;
    extraInfos?: DialogFormData | null;
};
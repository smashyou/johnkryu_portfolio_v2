"use client";

import { useState } from "react";
import { useForm, type UseFormRegister, type FieldErrors } from "react-hook-form";

interface FormData {
  name: string;
  email: string;
  message: string;
}

export function useContactForm(): {
  register: UseFormRegister<FormData>;
  errors: FieldErrors<FormData>;
  onSubmit: (e?: React.BaseSyntheticEvent) => Promise<void>;
  isSubmitting: boolean;
  submitMessage: string;
} {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState("");

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormData>();

  const submitForm = async (data: FormData) => {
    setIsSubmitting(true);
    setSubmitMessage("");

    try {
      // Import EmailJS
      const emailjs = (await import("@emailjs/browser")).default;

      const templateParams = {
        name: data.name,
        email: data.email,
        to_email: "johnminryu@gmail.com",
        message: data.message,
      };

      // Send email with public key in options
      const serviceId = process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID;
      const templateId = process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID;
      const publicKey = process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY;

      if (!serviceId || !templateId || !publicKey) {
        throw new Error("EmailJS credentials are not configured properly");
      }

      await emailjs.send(serviceId, templateId, templateParams, {
        publicKey: publicKey,
      });

      setSubmitMessage("Message sent successfully! I'll get back to you soon.");
      reset();
    } catch (error) {
      console.error("Email send error:", error);
      setSubmitMessage(
        "Something went wrong. Please try again or contact me directly at jkr@gmail.com"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    register,
    errors,
    onSubmit: handleSubmit(submitForm),
    isSubmitting,
    submitMessage,
  };
}

"use client";

import * as React from 'react';
import * as LabelPrimitive from '@radix-ui/react-label';
import { Slot } from '@radix-ui/react-slot';
import {
  Controller,
  ControllerProps,
  FieldPath,
  FieldValues,
  FormProvider,
  useFormContext,
  useFormState,
} from 'react-hook-form';

import { cn } from '@/lib/utils';
import { Label } from '@/components/ui/label'; // Az önce oluşturduğumuz 'Label'

// --- Form (Ana Sarmalayıcı) ---
// 'react-hook-form'dan gelen 'form' metotlarını
// Provider aracılığıyla tüm alt bileşenlere (FormItem, FormField...) dağıtır.
// '<form>' etiketini 'FormProvider' ile sarmalar.
const Form = FormProvider;

// --- Form Alanı (Field) Bağlayıcısı ---
// 'Controller' bileşenini (react-hook-form)
// 'FormItemContext' ile sarmalar.
// Bu, 'FormItem' ve 'FormLabel' gibi bileşenlerin
// alanın 'id'sini ve 'isInvalid' (hata) durumunu
// otomatik olarak bilmesini sağlar.
type FormFieldContextValue<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> = {
  name: TName;
};

const FormFieldContext = React.createContext<FormFieldContextValue>(
  {} as FormFieldContextValue,
);

const FormField = <
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({
  ...props
}: ControllerProps<TFieldValues, TName>) => {
  return (
    <FormFieldContext.Provider value={{ name: props.name }}>
      <Controller {...props} />
    </FormFieldContext.Provider>
  );
};

// --- Alan (Field) Durumunu Okuma Kancası (Hook) ---
// Bir alanın (field) mevcut durumunu (state) okumak için
// (örn. 'isInvalid', 'error' mesajı) kullanılır.
const useFormField = () => {
  const fieldContext = React.useContext(FormFieldContext);
  const itemContext = React.useContext(FormItemContext);
  // 'react-hook-form'dan alanın adını (name) ve hata durumunu al
  const { getFieldState, formState } = useFormContext();

  // Alanın adını (name) FormField'dan (Controller) al
  const fieldState = getFieldState(fieldContext.name, formState);

  if (!fieldContext) {
    throw new Error('useFormField must be used within a <FormField>');
  }

  // Alanın 'id'sini FormItem'dan al
  const { id } = itemContext;

  return {
    id,
    name: fieldContext.name,
    formItemId: `${id}-form-item`,
    formDescriptionId: `${id}-form-item-description`,
    formMessageId: `${id}-form-item-message`,
    ...fieldState,
  };
};

// --- Form Öğesi (Item) ---
// Bir formu oluşturan temel yapı taşıdır (Label, Input, Message).
// Alan (field) için benzersiz bir 'id' oluşturur ve sağlar.
type FormItemContextValue = {
  id: string;
};

const FormItemContext = React.createContext<FormItemContextValue>(
  {} as FormItemContextValue,
);

const FormItem = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  // Bu alan (field) için benzersiz bir ID oluştur
  const id = React.useId();

  return (
    <FormItemContext.Provider value={{ id }}>
      <div ref={ref} className={cn('space-y-2', className)} {...props} />
    </FormItemContext.Provider>
  );
});
FormItem.displayName = 'FormItem';

// --- Form Etiketi (Label) ---
// 'Label' bileşenimizi, 'useFormField' kancasından
// 'id' ve 'error' (isInvalid) durumunu alacak şekilde sarmalar.
const FormLabel = React.forwardRef<
  React.ElementRef<typeof LabelPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root>
>(({ className, ...props }, ref) => {
  const { error, formItemId } = useFormField();

  return (
    <Label
      ref={ref}
      className={cn(className)}
      // 'useFormField' kancasından gelen 'error' durumuna göre
      // 'isInvalid' prop'unu (ve dolayısıyla kırmızı rengi) ayarlar.
      isInvalid={!!error}
      // 'htmlFor', 'Input'un 'id'si ile eşleşir.
      htmlFor={formItemId}
      {...props}
    />
  );
});
FormLabel.displayName = 'FormLabel';

// --- Form Kontrolü (Control) ---
// 'Input', 'Select', 'Textarea' gibi asıl giriş (input)
// bileşenini sarmalar.
// 'react-hook-form'un 'Controller'ından gelen 'id', 'onChange',
// 'value', 'disabled' gibi 'prop'ları otomatik olarak
// altındaki 'Input' bileşenine bağlar.
const FormControl = React.forwardRef<
  React.ElementRef<typeof Slot>,
  React.ComponentPropsWithoutRef<typeof Slot>
>(({ ...props }, ref) => {
  const { error, formItemId, formDescriptionId, formMessageId } =
    useFormField();

  return (
    <Slot
      ref={ref}
      id={formItemId}
      aria-describedby={
        !error
          ? `${formDescriptionId}` // Hata yoksa, açıklamayı (description) bağla
          : `${formDescriptionId} ${formMessageId}` // Hata varsa, hem açıklamayı hem hata mesajını bağla
      }
      aria-invalid={!!error} // Erişilebilirlik (a11y) için hata durumunu belirt
      {...props}
    />
  );
});
FormControl.displayName = 'FormControl';

// --- Form Açıklaması (Description) ---
// 'Input'un altında görünen yardımcı metin (örn. "Şifreniz en az 8 karakter olmalı").
const FormDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => {
  const { formDescriptionId } = useFormField();

  return (
    <p
      ref={ref}
      id={formDescriptionId}
      className={cn('text-[0.8rem] text-muted-foreground', className)}
      {...props}
    />
  );
});
FormDescription.displayName = 'FormDescription';

// --- Form Mesajı (Message / Hata) ---
// Zod validasyon hatası (veya 'setError' ile) oluştuğunda
// 'Input'un altında görünen hata mesajı.
const FormMessage = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, children, ...props }, ref) => {
  const { error, formMessageId } = useFormField();
  // 'useFormState' (react-hook-form), form gönderildiğinde
  // (veya 'touched' olduğunda) hata mesajlarını alır.
  const { errors } = useFormState();
  const fieldError = errors[useFormField().name];
  
  // Hata mesajını al
  const body = error ? String(error?.message) : children;

  if (!body) {
    return null; // Hata yoksa (veya 'children' boşsa) hiçbir şey render etme.
  }

  return (
    <p
      ref={ref}
      id={formMessageId}
      className={cn('text-[0.Brem] font-medium text-destructive', className)}
      {...props}
    >
      {body}
    </p>
  );
});
FormMessage.displayName = 'FormMessage';

// Tüm form bileşenlerini dışa aktar
export {
  useFormField,
  Form,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
  FormField,
};
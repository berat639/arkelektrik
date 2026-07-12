import { z } from "zod";

export const contactFormSchema = z.object({
  name: z.string().min(2, "İsim en az 2 karakter olmalıdır."),
  email: z.string().email("Geçerli bir e-posta adresi giriniz."),
  message: z.string().min(10, "Mesaj en az 10 karakter olmalıdır."),
});

export type ContactFormData = z.infer<typeof contactFormSchema>;

export const postFormSchema = z.object({
  title: z.string().min(3, "Başlık en az 3 karakter olmalıdır."),
  slug: z.string().min(3, "Slug en az 3 karakter olmalıdır.").regex(
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
    "Slug sadece küçük harf, rakam ve tire içerebilir."
  ),
  content: z.string().min(10, "İçerik en az 10 karakter olmalıdır."),
  excerpt: z.string().min(10, "Özet en az 10 karakter olmalıdır.").max(300),
  cover_image_url: z.string().url().optional().or(z.literal("")),
  category_id: z.string().uuid().optional().or(z.literal("")),
  status: z.enum(["draft", "published"]),
  tag_ids: z.array(z.string().uuid()).optional(),
});

export type PostFormData = z.infer<typeof postFormSchema>;

export const categoryFormSchema = z.object({
  name: z.string().min(2, "Kategori adı en az 2 karakter olmalıdır."),
  slug: z.string().min(2).regex(
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
    "Slug sadece küçük harf, rakam ve tire içerebilir."
  ),
});

export type CategoryFormData = z.infer<typeof categoryFormSchema>;

export const tagFormSchema = z.object({
  name: z.string().min(2, "Etiket adı en az 2 karakter olmalıdır."),
  slug: z.string().min(2).regex(
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
    "Slug sadece küçük harf, rakam ve tire içerebilir."
  ),
});

export type TagFormData = z.infer<typeof tagFormSchema>;

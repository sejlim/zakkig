'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useState } from 'react';
import { useTranslation } from '../lib/i18n';
import { addToWaitlist } from '../app/actions/waitlist';
import { Form, Input, Button, toast } from '@heroui/react';
import { Check } from '@phosphor-icons/react';

const waitlistSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
});

type FormData = z.infer<typeof waitlistSchema>;

export function WaitlistForm() {
  const { t, locale } = useTranslation();
  const privacyHref = locale === 'en' ? '/en/privacy' : '/datenschutz';
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [showRedText, setShowRedText] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(waitlistSchema),
    defaultValues: {
      email: '',
    },
  });

  const onSubmit = async (data: FormData) => {
    setStatus('loading');
    try {
      const response = await addToWaitlist({ email: data.email });
      if (response.success) {
        setStatus('success');
        toast.success(t('formSuccess'), {
          indicator: <Check weight="bold" />
        });
        form.reset();
      } else {
        setStatus('error');
        toast.danger(
          response.errorCode === 'EMAIL_ALREADY_EXISTS'
            ? t('formDuplicateError')
            : t('formError')
        );
        setShowRedText(true);
      }
    } catch (err) {
      console.error(err);
      setStatus('error');
      toast.danger(t('formError'));
      setShowRedText(true);
    }
  };

  const onInvalid = () => {
    const error = form.formState.errors.email;
    if (error) {
      const val = form.getValues('email');
      const isEmpty = !val || val.trim() === '';
      toast.danger(
        isEmpty ? t('formRequiredError') : t('formInvalidEmailError')
      );
      setShowRedText(true);
    }
  };

  return (
    <div className="w-full max-w-lg">
      <Form
        onSubmit={form.handleSubmit(onSubmit, onInvalid)}
        validationBehavior="aria"
        className="flex flex-col sm:flex-row gap-3 w-full"
      >
        <div className="w-full sm:w-80 sm:flex-none flex flex-col">
          <Input
            aria-label={t('formPlaceholder')}
            id="email"
            type="email"
            placeholder={t('formPlaceholder')}
            disabled={status === 'loading'}
            className={`w-full h-12 px-6 rounded-full bg-white/10 hover:bg-white/15 focus:outline-none focus:bg-white/15 border-none transition-colors text-base placeholder:text-zinc-500 ${showRedText ? 'text-danger' : 'text-white'}`}
            {...form.register('email', {
              onChange: () => {
                if (showRedText) setShowRedText(false);
              },
            })}
          />
        </div>
        <Button
          type="submit"
          isPending={status === 'loading'}
          isDisabled={status === 'loading'}
          className="h-12 px-8 bg-white text-black hover:bg-zinc-200 rounded-full font-semibold text-base sm:w-auto w-full transition-colors"
        >
          {t('formButton')}
        </Button>
      </Form>
      <p className="mt-4 text-xs text-zinc-500 font-light text-left leading-normal px-4">
        {t('waitlistConsentPrefix')}{' '}
        <a
          href={privacyHref}
          className="text-white hover:underline font-normal"
        >
          {t('waitlistConsentLinkText')}
        </a>{' '}
        {t('waitlistConsentSuffix')}
      </p>

    </div>
  );
}

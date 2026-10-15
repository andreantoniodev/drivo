import React from 'react';

export interface SettingsSectionProps {
  title: string;
  description: string;
  children: React.ReactNode;
}

export const SettingsSection: React.FC<SettingsSectionProps> = ({
  title,
  description,
  children,
}) => (
  <section className="flex flex-col md:flex-row gap-6 md:gap-12 py-8">
    <div className="md:w-[280px] shrink-0 flex flex-col gap-1.5">
      <h2 className="text-[17px] font-semibold tracking-[-0.3px] text-fg">{title}</h2>
      <p className="text-[13px] leading-[1.5] text-fg-muted">{description}</p>
    </div>
    <div className="flex-1 min-w-0 bg-surface rounded-[18px] overflow-hidden">{children}</div>
  </section>
);

export interface SettingsCardFooterProps {
  message: React.ReactNode;
  action: React.ReactNode;
}

export const SettingsCardFooter: React.FC<SettingsCardFooterProps> = ({ message, action }) => (
  <div className="bg-white/[0.03] px-6 py-3.5 flex items-center justify-between gap-4">
    <p className="text-[13px] text-fg-subtle">{message}</p>
    {action}
  </div>
);

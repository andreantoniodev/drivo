import React from 'react';
import Image from 'next/image';

export interface AuthHeroProps {
  image: string;
  imageAlt: string;
  title: string[];
  description: string;
}

export const AuthHero: React.FC<AuthHeroProps> = ({ image, imageAlt, title, description }) => {
  return (
    <div className="hidden lg:flex lg:w-1/2 p-4 h-full flex-col justify-end relative select-none">
      <div className="relative z-10 h-full w-full rounded-[28px] overflow-hidden flex flex-col justify-end p-12">
        <Image
          src={image}
          alt={imageAlt}
          fill
          priority
          className="object-cover -z-10"
          sizes="50vw"
        />

        <div className="flex flex-col gap-3 z-10 w-full">
          <h2 className="text-[40px] font-bold tracking-[-1.2px] text-white leading-[1.1] max-w-[440px]">
            {title.map((line, index) => (
              <React.Fragment key={line}>
                {index > 0 && <br />}
                {line}
              </React.Fragment>
            ))}
          </h2>
          <p className="text-[15px] text-white/70 leading-[1.45] max-w-[420px]">{description}</p>
        </div>
      </div>
    </div>
  );
};

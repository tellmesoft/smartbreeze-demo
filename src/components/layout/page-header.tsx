type PageHeaderProps = {
  title: string;
  action?: React.ReactNode;
  toolbar?: React.ReactNode;
};

export function PageHeader({ title, action, toolbar }: PageHeaderProps) {
  return (
    <div className="mb-6">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <h1 className="text-[28px] font-bold leading-tight tracking-tight text-gray-900">{title}</h1>
        {toolbar || action ? (
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            {toolbar}
            {action}
          </div>
        ) : null}
      </div>
    </div>
  );
}

type ConfigErrorScreenProps = {
  problems: string[];
};

export const ConfigErrorScreen = ({ problems }: ConfigErrorScreenProps) => {
  return (
    <div className="flex h-screen items-center justify-center bg-[#f5f4ef] p-relaxed">
      <div
        role="alert"
        className="w-full max-w-lg rounded-lg bg-white p-relaxed shadow-xl"
      >
        <h1 className="text-lg font-semibold text-gray-900">
          The app isn't configured
        </h1>
        <p className="mt-small text-sm text-gray-600">
          Set these environment variables and rebuild. See{" "}
          <code>.env.example</code>.
        </p>
        <ul className="mt-normal list-disc space-y-xsmall pl-relaxed text-sm text-red-600">
          {problems.map((problem) => {
            return <li key={problem}>{problem}</li>;
          })}
        </ul>
      </div>
    </div>
  );
};

import { type ProjectAgent } from "@/app/data/content";

// The AI agents built for a project, as a list that opens on click. Shared by the
// classic project cards and the screenshot lightbox that every design concept uses.
const ProjectAgents = ({
  agents,
  className = "",
}: {
  agents?: ProjectAgent[];
  className?: string;
}) => {
  if (!agents || agents.length === 0) return null;
  return (
    <details className={`group/agents text-left ${className}`}>
      <summary className="cursor-pointer select-none list-none text-sm font-medium text-primary-400 hover:text-primary-300 transition-colors duration-300">
        <span className="inline-block mr-1 transition-transform duration-200 group-open/agents:rotate-90">
          ›
        </span>
        {agents.length} AI agents and their jobs
      </summary>
      <ol className="mt-3 max-h-[30vh] overflow-y-auto space-y-2 pr-1 text-xs leading-relaxed text-dark-300">
        {agents.map((agent) => (
          <li key={agent.name}>
            <span className="font-semibold text-white">{agent.name}:</span>{" "}
            {agent.job}
          </li>
        ))}
      </ol>
    </details>
  );
};

export default ProjectAgents;

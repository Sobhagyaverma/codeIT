import { useEffect, useState } from "react";
import {
  createCompetition,
  createProblem,
  getProblems,
} from "../lib/api";

import type { ProblemPublicDTO } from "../lib/types";

import DifficultyBadge from "../components/DifficultyBadge";

import { useAuth } from "../context/AuthContext";
import { ErrorState } from "../components/Loading";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

export default function Admin() {
  const { user } = useAuth();

  const [tab, setTab] = useState<"problem" | "competition">("problem");

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <h1 className="display mb-6 text-3xl font-semibold">
        Admin Dashboard
      </h1>

      <div className="mb-8 flex gap-3">
        {(["problem", "competition"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`rounded-lg border px-5 py-2 transition ${
              tab === t
                ? "border-[var(--accent)] bg-[var(--accent)] text-black"
                : "border-[var(--line)] hover:border-[var(--accent)]"
            }`}
          >
            {t === "problem"
              ? "Create Problem"
              : "Create Competition"}
          </button>
        ))}
      </div>

      {tab === "problem" && <CreateProblemForm />}

      {tab === "competition" && user && (
        <CreateCompetitionForm userId={user.id} />
      )}
    </div>
  );
}

function CreateProblemForm() {
  const [form, setForm] = useState({
    title: "",
    description: "",
    difficulty: "EASY",
    topics: "",
  });
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setStatus(null);
    try {
      await createProblem({
        title: form.title,
        description: form.description,
        difficulty: form.difficulty,
        topics: form.topics.split(",").map((t) => t.trim()).filter(Boolean),
      });
      setStatus("Problem created.");
      setForm({ title: "", description: "", difficulty: "EASY", topics: "" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create problem.");
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <input
        required placeholder="Title" value={form.title}
        onChange={(e) => setForm({ ...form, title: e.target.value })}
        className="w-full rounded-md border border-[var(--line)] bg-[var(--bg-inset)] px-3 py-2 text-sm focus:border-[var(--info)] focus:outline-none"
      />
      <textarea
        required placeholder="Description" rows={6} value={form.description}
        onChange={(e) => setForm({ ...form, description: e.target.value })}
        className="w-full rounded-md border border-[var(--line)] bg-[var(--bg-inset)] px-3 py-2 text-sm focus:border-[var(--info)] focus:outline-none"
      />
      <div className="flex gap-3">
        <select
          value={form.difficulty}
          onChange={(e) => setForm({ ...form, difficulty: e.target.value })}
          className="rounded-md border border-[var(--line)] bg-[var(--bg-inset)] px-3 py-2 text-sm"
        >
          <option>EASY</option>
          <option>MEDIUM</option>
          <option>HARD</option>
        </select>
        <input
          placeholder="topics, comma, separated" value={form.topics}
          onChange={(e) => setForm({ ...form, topics: e.target.value })}
          className="flex-1 rounded-md border border-[var(--line)] bg-[var(--bg-inset)] px-3 py-2 text-sm focus:border-[var(--info)] focus:outline-none"
        />
      </div>
      {status && <div className="text-sm text-[var(--ok)]">{status}</div>}
      {error && <ErrorState message={error} />}
      <button className="rounded-md bg-[var(--accent)] px-4 py-2 text-sm font-medium text-[#0a0d12] hover:brightness-110">
        Create problem
      </button>
    </form>
  );
}

function CreateCompetitionForm({ userId }: { userId: number }) {
const [form, setForm] = useState({
    title: "",
});

const [startDate, setStartDate] = useState<Date | null>(null);
const [endDate, setEndDate] = useState<Date | null>(null);

  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [allProblems, setAllProblems] = useState<ProblemPublicDTO[]>([]);
  const [selectedProblems, setSelectedProblems] = useState<
    ProblemPublicDTO[]
  >([]);

  const [search, setSearch] = useState("");
  const [showProblemForm, setShowProblemForm] = useState(false);

  const [quickProblem, setQuickProblem] = useState({
  title: "",
  difficulty: "EASY",
  topics: "",
  description: "",
  examples: [
    {
      input: "",
      output: "",
      explanation: "",
    },
  ],
  constraints: [""],
  hiddenTestCases: [
    {
      input: "",
      output: "",
    },
  ],
 });

  useEffect(() => {
    getProblems()
      .then(setAllProblems)
      .catch((err) => console.error(err));
  }, []);

  const filteredProblems = allProblems.filter((problem) => {
    const topics =
      typeof problem.topics === "string"
        ? problem.topics
        : JSON.stringify(problem.topics);

    return `${problem.id} ${problem.title} ${topics}`
      .toLowerCase()
      .includes(search.toLowerCase());
  });

  const addProblem = (problem: ProblemPublicDTO) => {
    if (selectedProblems.some((p) => p.id === problem.id)) return;

    setSelectedProblems((prev) => [...prev, problem]);
  };

  const removeProblem = (id: number) => {
    setSelectedProblems((prev) =>
      prev.filter((p) => p.id !== id)
    );
  };
  
  const createQuickProblem = async () => {
  try {
    const createdProblem = await createProblem({
      title: quickProblem.title,
      description: quickProblem.description,
      difficulty: quickProblem.difficulty,
      topics: quickProblem.topics
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),

      examples: quickProblem.examples,

      constraintsData: quickProblem.constraints,

      hiddenTestCases: quickProblem.hiddenTestCases,
    });

    // Refresh problem list
    const updatedProblems = await getProblems();
    setAllProblems(updatedProblems);

    // Auto-select newly created problem
    if (
      createdProblem &&
      typeof createdProblem === "object" &&
      "id" in createdProblem
    ) {
      setSelectedProblems((prev) => [
        ...prev,
        createdProblem as ProblemPublicDTO,
      ]);
    }

    // Reset form
    setQuickProblem({
      title: "",
      difficulty: "EASY",
      topics: "",
      description: "",
      examples: [
        {
          input: "",
          output: "",
          explanation: "",
        },
      ],
      constraints: [""],
      hiddenTestCases: [
        {
          input: "",
          output: "",
        },
      ],
    });

    setShowProblemForm(false);
  } catch (err) {
    console.error(err);
    setError("Failed to create problem.");
  }
};

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();

    setError(null);
    setStatus(null);

    try {
  await createCompetition({
  title: form.title,
  createdBy: userId,
  startTime: startDate?.toISOString() ?? "",
  endTime: endDate?.toISOString() ?? "",
});

      setStatus("Competition created successfully.");

setForm({
  title: "",
});

setStartDate(null);
setEndDate(null);

      setSelectedProblems([]);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to create competition."
      );
    }
  };

  return (
    <form onSubmit={submit} className="space-y-6">
            <input
        required
        placeholder="Competition Title"
        value={form.title}
        onChange={(e) =>
          setForm({
            ...form,
            title: e.target.value,
          })
        }
        className="w-full rounded-md border border-[var(--line)] bg-[var(--bg-inset)] px-3 py-2 text-sm"
      />

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="mb-1 block text-sm">
            Start Time
          </label>

          <DatePicker
  selected={startDate}
  onChange={(date: Date | null) => setStartDate(date)}
  showTimeSelect
  timeIntervals={15}
  dateFormat="dd/MM/yyyy h:mm aa"
  placeholderText="Select Start Date & Time"
  className="w-full rounded-md border border-[var(--line)] bg-[var(--bg-inset)] px-3 py-2 text-sm"
/>

        </div>

        <div>
          <label className="mb-1 block text-sm">
            End Time
          </label>

          <DatePicker
  selected={endDate}
  onChange={(date: Date | null) => setEndDate(date)}
  showTimeSelect
  timeIntervals={15}
  dateFormat="dd/MM/yyyy h:mm aa"
  placeholderText="Select End Date & Time"
  minDate={startDate ?? undefined}
  className="w-full rounded-md border border-[var(--line)] bg-[var(--bg-inset)] px-3 py-2 text-sm"
/>

        </div>
      </div>

      <div className="rounded-lg border border-[var(--line)] p-4">

        <h2 className="mb-4 text-lg font-semibold">

          Assign Problems

        </h2>

        <input
          value={search}
          onChange={(e) =>
            setSearch(e.target.value)
          }
          placeholder="Search by ID, title or topic..."
          className="mb-4 w-full rounded-md border border-[var(--line)] bg-[var(--bg-inset)] px-3 py-2 text-sm"
        />

        <div className="max-h-72 overflow-y-auto space-y-2">
                   {filteredProblems.map((problem) => (
            <div
              key={problem.id}
              className="flex items-center justify-between rounded-lg border border-[var(--line)] bg-[var(--bg-raised)] p-3"
            >
              <div className="min-w-0">
                <div className="font-medium">
                  {problem.id}. {problem.title}
                </div>

                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <DifficultyBadge difficulty={problem.difficulty} />

                  <span className="rounded bg-[var(--bg-inset)] px-2 py-0.5 text-xs">
                    {problem.topics}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => addProblem(problem)}
                disabled={selectedProblems.some(
                  (p) => p.id === problem.id
                )}
                className="rounded-md bg-[var(--accent)] px-3 py-1 text-sm font-medium text-[#0a0d12] hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {selectedProblems.some(
                  (p) => p.id === problem.id
                )
                  ? "Added"
                  : "Add"}
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-lg border border-[var(--line)] p-4">

        <div className="mb-3 flex items-center justify-between">

          <h2 className="text-lg font-semibold">

            Selected Problems

          </h2>

          <span className="text-sm text-[var(--text-dim)]">

            {selectedProblems.length} Selected

          </span>

        </div>

        <div className="space-y-2">
                    {selectedProblems.length === 0 ? (
            <div className="rounded-md border border-dashed border-[var(--line)] p-4 text-center text-sm text-[var(--text-dim)]">
              No problems selected yet.
            </div>
          ) : (
            selectedProblems.map((problem) => (
              <div
                key={problem.id}
                className="flex items-center justify-between rounded-lg border border-[var(--line)] bg-[var(--bg-raised)] p-3"
              >
                <div className="min-w-0">
                  <div className="font-medium">
                    {problem.id}. {problem.title}
                  </div>

                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <DifficultyBadge difficulty={problem.difficulty} />

                    <span className="rounded bg-[var(--bg-inset)] px-2 py-0.5 text-xs">
                      {problem.topics}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => removeProblem(problem.id)}
                  className="rounded-md bg-red-500 px-3 py-1 text-sm font-medium text-white hover:bg-red-600"
                >
                  Remove
                </button>
              </div>
            ))
          )}
        </div>

        <div className="mt-4 rounded-md bg-[var(--bg-inset)] p-3 text-sm">
          <strong>Total Selected:</strong> {selectedProblems.length}
        </div>
        <div className="mt-8 border-t border-[var(--line)] pt-6">

  <button
    type="button"
    onClick={() => setShowProblemForm(!showProblemForm)}
    className="mb-5 rounded-md border border-[var(--accent)] px-4 py-2 text-sm text-[var(--accent)] hover:bg-[var(--accent)] hover:text-black"
  >
    {showProblemForm
      ? "Hide Quick Create"
      : "➕ Quick Create Problem"}
  </button>

  {showProblemForm && (
    <div className="space-y-4 rounded-xl border border-[var(--line)] p-5">

      <h2 className="text-lg font-semibold">
        Quick Create Problem
      </h2>

      <input
       value={quickProblem.title}
        onChange={(e) =>
        setQuickProblem({
      ...quickProblem,
      title: e.target.value,
    })
  }
  placeholder="Problem Title"
  className="w-full rounded-md border border-[var(--line)] bg-[var(--bg-inset)] px-3 py-2"
/>

<select
  value={quickProblem.difficulty}
  onChange={(e) =>
    setQuickProblem({
      ...quickProblem,
      difficulty: e.target.value,
    })
  }
  className="w-full rounded-md border border-[var(--line)] bg-[var(--bg-inset)] px-3 py-2"
>
  <option value="EASY">Easy</option>
  <option value="MEDIUM">Medium</option>
  <option value="HARD">Hard</option>
</select>

<input
  value={quickProblem.topics}
  onChange={(e) =>
    setQuickProblem({
      ...quickProblem,
      topics: e.target.value,
    })
  }
  placeholder="Arrays, HashMap"
  className="w-full rounded-md border border-[var(--line)] bg-[var(--bg-inset)] px-3 py-2"
/>

<textarea
  rows={5}
  value={quickProblem.description}
  onChange={(e) =>
    setQuickProblem({
      ...quickProblem,
      description: e.target.value,
    })
  }
  placeholder="Problem Description"
  className="w-full rounded-md border border-[var(--line)] bg-[var(--bg-inset)] px-3 py-2"
/>

<div className="space-y-4">

  <h3 className="text-lg font-semibold">
    Examples
  </h3>

  {quickProblem.examples.map((example, index) => (

    <div
      key={index}
      className="space-y-3 rounded-lg border border-[var(--line)] p-4"
    >

      <h4 className="font-medium">
        Example {index + 1}
      </h4>

      <textarea
        rows={2}
        placeholder="Input"
        value={example.input}
        onChange={(e) => {
          const updated = [...quickProblem.examples];
          updated[index].input = e.target.value;

          setQuickProblem({
            ...quickProblem,
            examples: updated,
          });
        }}
        className="w-full rounded border border-[var(--line)] bg-[var(--bg-inset)] px-3 py-2"
      />

      <textarea
        rows={2}
        placeholder="Output"
        value={example.output}
        onChange={(e) => {
          const updated = [...quickProblem.examples];
          updated[index].output = e.target.value;

          setQuickProblem({
            ...quickProblem,
            examples: updated,
          });
        }}
        className="w-full rounded border border-[var(--line)] bg-[var(--bg-inset)] px-3 py-2"
      />

      <textarea
        rows={2}
        placeholder="Explanation"
        value={example.explanation}
        onChange={(e) => {
          const updated = [...quickProblem.examples];
          updated[index].explanation = e.target.value;

          setQuickProblem({
            ...quickProblem,
            examples: updated,
          });
        }}
        className="w-full rounded border border-[var(--line)] bg-[var(--bg-inset)] px-3 py-2"
      />

    </div>

  ))}

  <button
    type="button"
    onClick={() =>
      setQuickProblem({
        ...quickProblem,
        examples: [
          ...quickProblem.examples,
          {
            input: "",
            output: "",
            explanation: "",
          },
        ],
      })
    }
    className="rounded-md border border-[var(--line)] px-4 py-2 hover:bg-[var(--bg-inset)]"
  >
    + Add Example
  </button>

</div>

<div className="space-y-4">

  <h3 className="text-lg font-semibold">
    Constraints
  </h3>

  {quickProblem.constraints.map((constraint, index) => (

    <div
      key={index}
      className="flex gap-2"
    >

      <input
        value={constraint}
        onChange={(e) => {

          const updated = [...quickProblem.constraints];

          updated[index] = e.target.value;

          setQuickProblem({
            ...quickProblem,
            constraints: updated,
          });

        }}
        placeholder={`Constraint ${index + 1}`}
        className="flex-1 rounded border border-[var(--line)] bg-[var(--bg-inset)] px-3 py-2"
      />

      <button
        type="button"
        onClick={() => {

          const updated =
            quickProblem.constraints.filter((_, i) => i !== index);

          setQuickProblem({
            ...quickProblem,
            constraints: updated.length ? updated : [""],
          });

        }}
        className="rounded bg-red-500 px-3 text-white"
      >

        ✕

      </button>

    </div>

  ))}

  <button
    type="button"
    onClick={() =>
      setQuickProblem({
        ...quickProblem,
        constraints: [
          ...quickProblem.constraints,
          "",
        ],
      })
    }
    className="rounded border border-[var(--line)] px-4 py-2 hover:bg-[var(--bg-inset)]"
  >
    + Add Constraint
  </button>

</div>

<div className="space-y-4">

  <h3 className="text-lg font-semibold">
    Hidden Test Cases
  </h3>

  {quickProblem.hiddenTestCases.map((testCase, index) => (

    <div
      key={index}
      className="space-y-3 rounded-lg border border-[var(--line)] p-4"
    >

      <div className="flex items-center justify-between">

        <h4 className="font-medium">
          Test Case {index + 1}
        </h4>

        <button
          type="button"
          onClick={() => {

            const updated =
              quickProblem.hiddenTestCases.filter((_, i) => i !== index);

            setQuickProblem({
              ...quickProblem,
              hiddenTestCases:
                updated.length
                  ? updated
                  : [{ input: "", output: "" }],
            });

          }}
          className="rounded bg-red-500 px-3 py-1 text-white"
        >
          Remove
        </button>

      </div>

      <textarea
        rows={2}
        placeholder="Hidden Input"
        value={testCase.input}
        onChange={(e) => {

          const updated =
            [...quickProblem.hiddenTestCases];

          updated[index].input =
            e.target.value;

          setQuickProblem({
            ...quickProblem,
            hiddenTestCases: updated,
          });

        }}
        className="w-full rounded border border-[var(--line)] bg-[var(--bg-inset)] px-3 py-2"
      />

      <textarea
        rows={2}
        placeholder="Expected Output"
        value={testCase.output}
        onChange={(e) => {

          const updated =
            [...quickProblem.hiddenTestCases];

          updated[index].output =
            e.target.value;

          setQuickProblem({
            ...quickProblem,
            hiddenTestCases: updated,
          });

        }}
        className="w-full rounded border border-[var(--line)] bg-[var(--bg-inset)] px-3 py-2"
      />

    </div>

  ))}

  <button
    type="button"
    onClick={() =>
      setQuickProblem({
        ...quickProblem,
        hiddenTestCases: [
          ...quickProblem.hiddenTestCases,
          {
            input: "",
            output: "",
          },
        ],
      })
    }
    className="rounded border border-[var(--line)] px-4 py-2 hover:bg-[var(--bg-inset)]"
  >
    + Add Hidden Test Case
  </button>

</div>

<button
  type="button"
  onClick={createQuickProblem}
  className="rounded-md bg-[var(--accent)] px-5 py-2 text-sm font-medium text-[#0a0d12] hover:brightness-110"
>
  Create & Add Problem
</button>

    </div>
   )}

        </div>
      </div>

      {status && (
        <div className="text-sm text-[var(--ok)]">
          {status}
        </div>
      )}

      {error && <ErrorState message={error} />}

      <button
        type="submit"
        className="rounded-md bg-[var(--accent)] px-5 py-2 text-sm font-medium text-[#0a0d12] hover:brightness-110"
      >
        Create Competition
      </button>
    </form>
  );
}
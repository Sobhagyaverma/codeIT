import { Link } from "react-router-dom";

export default function CodeRoomsSection() {
  return (
    <section className="reveal relative z-20 mx-auto w-full max-w-[1200px] px-6 py-24">
      <div className="mb-16 text-center">
        <h2 className="font-headline-lg mb-4 text-[32px] font-medium text-white">
          Collaborative CodeRooms
        </h2>
        <p className="mx-auto max-w-2xl text-[15px] text-white/50">
          Interview prep or pair programming? CodeRooms provide a shared
          environment with real-time execution, whiteboarding, and chat.
        </p>
      </div>
      <Link
        to="/coderoom"
        className="glass-card relative block overflow-hidden rounded-2xl border border-white/10 p-2"
      >
        <div className="flex items-center gap-2 border-b border-white/5 bg-black/50 p-3">
          <div className="h-3 w-3 rounded-full bg-red-500/80" />
          <div className="h-3 w-3 rounded-full bg-yellow-500/80" />
          <div className="h-3 w-3 rounded-full bg-green-500/80" />
          <div className="font-code-sm mx-auto ml-4 max-w-md flex-1 rounded-md border border-white/5 bg-white/5 px-4 py-1 text-center text-[12px] text-white/50">
            codeit.dev/room/a1b2c3
          </div>
          <div className="flex gap-2">
            <div className="h-6 w-6 rounded-full border border-white/20 bg-blue-500/50" />
            <div className="h-6 w-6 rounded-full border border-white/20 bg-pink-500/50" />
          </div>
        </div>
        <div className="grid h-[400px] grid-cols-4">
          <div className="font-code-sm relative col-span-3 bg-[#050508] p-4 text-[13px]">
            <div className="mb-4 flex gap-4 border-b border-white/10 pb-2">
              <span className="cursor-pointer border-b-2 border-[#a855f7] pb-2 text-white">
                solution.js
              </span>
              <span className="cursor-pointer pb-2 text-white/50 transition-colors hover:text-white">
                whiteboard
              </span>
            </div>
            <div className="text-[#a855f7]">
              function <span className="text-blue-400">reverseList</span>(head){" "}
              {"{"}
            </div>
            <div className="pl-4 text-white/70">let prev = null;</div>
            <div className="relative mt-0 pl-4 text-white/70">
              let curr = head;
              <div className="absolute top-1 -left-1 h-4 w-0.5 animate-pulse bg-pink-500" />
              <div className="absolute -top-5 left-0 rounded rounded-bl-none bg-pink-500 px-1 text-[10px] text-white">
                Alice
              </div>
            </div>
            <div className="mt-2 pl-4 text-white/70">while (curr !== null) {"{"}</div>
            <div className="pl-8 text-white/70">const nextTemp = curr.next;</div>
            <div className="relative pl-8 text-white/70">
              curr.next = prev;
              <div className="absolute top-1 -left-1 h-4 w-0.5 animate-pulse bg-blue-500" />
              <div className="absolute -top-5 left-0 rounded rounded-bl-none bg-blue-500 px-1 text-[10px] text-white">
                Bob
              </div>
            </div>
            <div className="pl-8 text-white/70">prev = curr;</div>
            <div className="pl-8 text-white/70">curr = nextTemp;</div>
            <div className="pl-4 text-white/70">{"}"}</div>
            <div className="pl-4 text-white/70">return prev;</div>
            <div className="text-white/70">{"}"}</div>
          </div>
          <div className="col-span-1 flex flex-col border-l border-white/10 bg-white/5 p-4">
            <div className="mb-4 border-b border-white/10 pb-2 text-[13px] font-medium text-white">
              Room Chat
            </div>
            <div className="flex flex-1 flex-col gap-3 overflow-hidden">
              <div className="flex flex-col gap-1">
                <span className="text-[10px] text-pink-400">Alice</span>
                <span className="rounded-lg rounded-tl-none bg-white/5 p-2 text-[12px] text-white/80">
                  I&apos;ll handle the pointer updates in the loop.
                </span>
              </div>
              <div className="flex flex-col items-end gap-1">
                <span className="text-[10px] text-blue-400">Bob (You)</span>
                <span className="rounded-lg rounded-tr-none bg-[#a855f7]/20 p-2 text-[12px] text-white/80">
                  Sounds good. I think we have the base case covered.
                </span>
              </div>
            </div>
            <div className="mt-4">
              <input
                className="w-full rounded border border-white/10 bg-black/50 p-2 text-[12px] text-white focus:border-[#a855f7]/50 focus:outline-none"
                placeholder="Type a message..."
                type="text"
                readOnly
                tabIndex={-1}
                onClick={(e) => e.preventDefault()}
              />
            </div>
          </div>
        </div>
      </Link>
    </section>
  );
}

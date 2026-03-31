import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import { useState } from "react";

function Input({ label, value, onChange, type = "text", placeholder }) {
  return (
    <label className="block">
      <span className="text-xs font-extrabold text-[color:var(--c-muted)]">
        {label}
      </span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={[
          "mt-2 w-full rounded-2xl border border-[color:var(--c-border)] bg-[color:var(--c-surface)] px-4 py-3",
          "text-sm font-semibold text-[color:var(--c-text)] placeholder:text-[color:var(--c-muted-2)]",
          "transition duration-200 focus:outline-none focus:ring-2 focus:ring-[color:var(--c-focus-ring)] focus:border-[color:var(--c-border-strong)]"
        ].join(" ")}
      />
    </label>
  );
}

export default function ChangePassword() {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");

  const disabled = !current || !next || next !== confirm;

  return (
    <section className="space-y-4">
      <div>
        <p className="text-sm font-semibold text-[color:var(--c-muted)]">
          비밀번호 변경
        </p>
        <p className="mt-1 text-lg font-extrabold">보안 설정</p>
      </div>

      <Card className="space-y-4">
        <Input
          label="현재 비밀번호"
          type="password"
          value={current}
          onChange={setCurrent}
          placeholder="현재 비밀번호 입력"
        />
        <Input
          label="새 비밀번호"
          type="password"
          value={next}
          onChange={setNext}
          placeholder="새 비밀번호 입력"
        />
        <Input
          label="새 비밀번호 확인"
          type="password"
          value={confirm}
          onChange={setConfirm}
          placeholder="한 번 더 입력"
        />

        <Button type="button" disabled={disabled}>
          변경하기 (더미)
        </Button>

        {next && confirm && next !== confirm ? (
          <p className="text-xs font-semibold text-[color:var(--c-text)]">
            새 비밀번호가 일치하지 않아요.
          </p>
        ) : (
          <p className="text-xs font-semibold text-[color:var(--c-muted-2)]">
            실제 저장/검증 로직은 아직 연결되지 않았어요.
          </p>
        )}
      </Card>
    </section>
  );
}

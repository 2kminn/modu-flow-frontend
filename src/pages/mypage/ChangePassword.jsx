import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import FloatingLabelInput from "@/components/ui/FloatingLabelInput";
import { useState } from "react";

export default function ChangePassword() {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");

  const disabled = !current || !next || next !== confirm;
  const inputClassName = [
    "font-semibold text-[color:var(--c-text)]",
    "focus:outline-none focus:ring-2 focus:ring-[color:var(--c-focus-ring)] focus:border-[color:var(--c-border-strong)]",
  ].join(" ");

  return (
    <section className="space-y-4">
      <div>
        <p className="text-sm font-semibold text-[color:var(--c-muted)]">
          비밀번호 변경
        </p>
        <p className="mt-1 text-lg font-extrabold">보안 설정</p>
      </div>

      <Card className="space-y-4">
        <FloatingLabelInput
          id="change-password-current"
          label="현재 비밀번호"
          type="password"
          autoComplete="current-password"
          value={current}
          onChange={(e) => setCurrent(e.target.value)}
          placeholder="현재 비밀번호 입력"
          inputClassName={inputClassName}
        />
        <FloatingLabelInput
          id="change-password-next"
          label="새 비밀번호"
          type="password"
          autoComplete="new-password"
          value={next}
          onChange={(e) => setNext(e.target.value)}
          placeholder="새 비밀번호 입력"
          inputClassName={inputClassName}
        />
        <FloatingLabelInput
          id="change-password-confirm"
          label="새 비밀번호 확인"
          type="password"
          autoComplete="new-password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          placeholder="한 번 더 입력"
          inputClassName={inputClassName}
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

import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import FloatingLabelInput from "@/components/ui/FloatingLabelInput";
import { changePassword } from "@/api/auth";
import { useState } from "react";

export default function ChangePassword() {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [status, setStatus] = useState({ type: "idle", message: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const disabled = isSubmitting || !current || !next || next !== confirm;
  const inputClassName = [
    "font-semibold text-[color:var(--c-text)]",
    "focus:outline-none focus:ring-2 focus:ring-[color:var(--c-focus-ring)] focus:border-[color:var(--c-border-strong)]",
  ].join(" ");

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!current || !next) {
      setStatus({ type: "error", message: "현재 비밀번호와 새 비밀번호를 입력해 주세요." });
      return;
    }

    if (next !== confirm) {
      setStatus({ type: "error", message: "새 비밀번호가 일치하지 않아요." });
      return;
    }

    setIsSubmitting(true);
    setStatus({ type: "idle", message: "" });

    const result = await changePassword({
      currentPassword: current,
      newPassword: next,
      confirmPassword: confirm
    });

    setIsSubmitting(false);

    if (!result.ok) {
      setStatus({
        type: "error",
        message: result.message || "비밀번호 변경에 실패했어요."
      });
      return;
    }

    setCurrent("");
    setNext("");
    setConfirm("");
    setStatus({ type: "success", message: "비밀번호가 변경되었어요." });
  };

  return (
    <section className="space-y-4">
      <div>
        <p className="text-sm font-semibold text-[color:var(--c-muted)]">
          비밀번호 변경
        </p>
        <p className="mt-1 text-lg font-extrabold">보안 설정</p>
      </div>

      <Card as="form" className="space-y-4" onSubmit={handleSubmit}>
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

        <Button type="submit" disabled={disabled}>
          {isSubmitting ? "변경 중..." : "변경하기"}
        </Button>

        {next && confirm && next !== confirm ? (
          <p className="text-xs font-semibold text-red-500">
            새 비밀번호가 일치하지 않아요.
          </p>
        ) : status.message ? (
          <p
            className={[
              "text-xs font-semibold",
              status.type === "error" ? "text-red-500" : "text-emerald-600"
            ].join(" ")}
          >
            {status.message}
          </p>
        ) : (
          <p className="text-xs font-semibold text-[color:var(--c-muted-2)]">
            변경 후에는 다음 로그인부터 새 비밀번호를 사용해 주세요.
          </p>
        )}
      </Card>
    </section>
  );
}

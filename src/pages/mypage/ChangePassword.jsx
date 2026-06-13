// 비밀번호 변경 화면이다. 일반 계정은 인증 API에 변경을 요청하고 소셜 계정은 변경을 제한한다.
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import FloatingLabelInput from "@/components/ui/FloatingLabelInput";
import { changePassword } from "@/api/auth";
import { getStoredAuthProvider, isSocialAuthSession } from "@/auth/auth";
import { useState } from "react";
import { Link } from "react-router-dom";

const SOCIAL_PROVIDER_LABELS = {
  google: "구글",
  kakao: "카카오",
  social: "소셜"
};

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
  const isSocialAccount = isSocialAuthSession();
  const providerLabel = SOCIAL_PROVIDER_LABELS[getStoredAuthProvider()] || "소셜";

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (isSocialAccount) {
      setStatus({ type: "error", message: "소셜 로그인 계정은 비밀번호를 변경할 수 없어요." });
      return;
    }

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

  if (isSocialAccount) {
    return (
      <section className="space-y-4">
        <div>
          <p className="text-sm font-semibold text-[color:var(--c-muted)]">
            비밀번호 변경
          </p>
          <p className="mt-1 text-lg font-extrabold">보안 설정</p>
        </div>

        <Card className="space-y-4">
          <div>
            <p className="text-base font-extrabold text-[color:var(--c-text)]">
              비밀번호 변경이 제한되어 있어요.
            </p>
            <p className="mt-2 text-sm font-semibold leading-6 text-[color:var(--c-muted)]">
              {providerLabel} 로그인 계정은 ModuFlow에서 별도 비밀번호를 관리하지 않아요.
              비밀번호 변경은 연결된 소셜 서비스에서 진행해 주세요.
            </p>
          </div>

          <Link
            to="/mypage"
            className="inline-flex w-full items-center justify-center rounded-2xl border border-[color:var(--c-border)] bg-[color:var(--c-surface)] px-5 py-4 text-base font-semibold text-[color:var(--c-text)] shadow-sm transition duration-200 hover:border-[color:var(--c-border-strong)] hover:bg-[color:var(--c-primary-soft)] active:scale-[0.99] focus:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--c-focus-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--c-surface)]"
          >
            마이페이지로 돌아가기
          </Link>
        </Card>
      </section>
    );
  }

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
              status.type === "error" ? "text-red-500" : "text-[color:var(--c-success)]"
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

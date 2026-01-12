import { Lock, User as UserIcon, Loader2, ArrowRight, ArrowLeft } from 'lucide-react';
import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';

import { login, signup } from '../services/LogService';
import { loginSuccess } from '../store/auth';

export const SignupPage: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('비밀번호가 일치하지 않습니다.');
      return;
    }

    setIsLoading(true);
    try {
      await signup(username, password);
      // Auto login after signup
      const result = await login(username, password);
      if (result && result.access_token) {
        dispatch(loginSuccess({ token: result.access_token, username }));
        navigate('/');
      } else {
        navigate('/login');
      }
    } catch {
      setError('회원가입에 실패했습니다. 이미 사용 중인 아이디일 수 있습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-base-200 p-4">
      {/* Background decorations */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -left-24 -top-24 h-96 w-96 rounded-full bg-secondary/10 blur-3xl" />
        <div className="absolute -bottom-32 -right-32 h-[500px] w-[500px] rounded-full bg-primary/10 blur-3xl" />
      </div>

      <div className="relative w-full max-w-sm">
        {/* Back button */}
        <Link
          to="/"
          className="btn btn-ghost btn-sm mb-6 gap-2 rounded-lg text-base-content/60 transition-colors hover:text-base-content"
        >
          <ArrowLeft size={16} />
          <span>홈으로 돌아가기</span>
        </Link>

        {/* Card */}
        <div className="overflow-hidden rounded-2xl border border-base-content/5 bg-base-100/80 shadow-2xl backdrop-blur-xl">
          {/* Header */}
          <div className="relative overflow-hidden bg-gradient-to-br from-secondary/20 via-secondary/10 to-transparent px-8 pb-6 pt-10">
            <div className="absolute -left-8 -top-8 h-32 w-32 rounded-full bg-secondary/20 blur-2xl" />
            <div className="absolute -right-4 top-12 h-20 w-20 rounded-full bg-primary/20 blur-xl" />

            <div className="relative">
              <h1 className="text-2xl font-bold tracking-tight">시작해볼까요?</h1>
              <p className="mt-1 text-sm text-base-content/60">새 계정을 만들어보세요</p>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="px-8 py-6">
            {error && (
              <div className="mb-4 rounded-xl border border-error/20 bg-error/10 px-4 py-3 text-sm text-error">
                {error}
              </div>
            )}

            <div className="form-control mb-4">
              <label className="label pb-1">
                <span className="label-text text-xs font-medium uppercase tracking-wider text-base-content/50">
                  사용자 이름
                </span>
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                  <UserIcon size={16} className="text-base-content/30" />
                </div>
                <input
                  type="text"
                  placeholder="username"
                  className="input input-bordered w-full rounded-xl border-base-content/10 bg-base-200/50 pl-11 transition-all placeholder:text-base-content/30 focus:border-primary focus:bg-base-200"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="form-control mb-4">
              <label className="label pb-1">
                <span className="label-text text-xs font-medium uppercase tracking-wider text-base-content/50">
                  비밀번호
                </span>
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                  <Lock size={16} className="text-base-content/30" />
                </div>
                <input
                  type="password"
                  placeholder="••••••••"
                  className="input input-bordered w-full rounded-xl border-base-content/10 bg-base-200/50 pl-11 transition-all placeholder:text-base-content/30 focus:border-primary focus:bg-base-200"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="form-control mb-6">
              <label className="label pb-1">
                <span className="label-text text-xs font-medium uppercase tracking-wider text-base-content/50">
                  비밀번호 확인
                </span>
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                  <Lock size={16} className="text-base-content/30" />
                </div>
                <input
                  type="password"
                  placeholder="••••••••"
                  className="input input-bordered w-full rounded-xl border-base-content/10 bg-base-200/50 pl-11 transition-all placeholder:text-base-content/30 focus:border-primary focus:bg-base-200"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  disabled={isLoading}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="btn btn-primary w-full rounded-xl shadow-lg shadow-primary/25 transition-all hover:shadow-primary/40 disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  <span>가입 중...</span>
                </>
              ) : (
                <>
                  <span>회원가입</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          {/* Footer */}
          <div className="border-t border-base-content/5 bg-base-200/30 px-8 py-4">
            <p className="text-center text-sm text-base-content/60">
              이미 계정이 있으신가요?{' '}
              <Link
                to="/login"
                className="font-semibold text-primary transition-colors hover:text-primary-focus hover:underline"
              >
                로그인
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};


<script lang="ts">
  import PlatformIcons from '$lib/components/shared/PlatformIcons.svelte'
  import { signInWithEmail, signInWithOAuth, signUpWithEmail } from '$lib/auth/session-service'
  import type { AuthConfig } from '$lib/server/auth-config'

  type AuthMode = 'sign-in' | 'sign-up'

  let {
    authConfig,
    redirectTo = '/',
    onSuccess
  } = $props<{
    authConfig: AuthConfig
    redirectTo?: string
    onSuccess?: () => void
  }>()

  let mode = $state<AuthMode>('sign-in')
  let name = $state('')
  let email = $state('')
  let password = $state('')
  let error = $state<string | null>(null)
  let message = $state<string | null>(null)
  let isSubmitting = $state(false)

  async function handleSubmit(event: SubmitEvent) {
    event.preventDefault()
    error = null
    message = null

    if (!authConfig.configured) {
      error = 'Supabase auth is not configured.'
      return
    }

    if (!authConfig.providers.email) {
      error = 'Email authentication is disabled.'
      return
    }

    isSubmitting = true

    try {
      if (mode === 'sign-in') {
        const result = await signInWithEmail(email.trim(), password)
        if (result.error) {
          error = result.error.message
          return
        }

        onSuccess?.()
        window.location.assign(redirectTo)
        return
      }

      const result = await signUpWithEmail(
        email.trim(),
        password,
        name.trim() || email.trim().split('@')[0] || 'User'
      )

      if (result.error) {
        error = result.error.message
        return
      }

      if (result.data?.session) {
        onSuccess?.()
        window.location.assign(redirectTo)
        return
      }

      message = 'Account created. Check your email to confirm your sign-in.'
      mode = 'sign-in'
    } finally {
      isSubmitting = false
    }
  }

  async function handleSso(provider: 'github' | 'google' | 'apple') {
    error = null
    message = null
    isSubmitting = true

    try {
      const result = await signInWithOAuth(provider, redirectTo)
      if (result.error) {
        error = result.error.message
      }
    } finally {
      isSubmitting = false
    }
  }
</script>

{#if !authConfig.configured}
  <div class="grid gap-3 text-sm text-muted-foreground">
    <p class="m-0">Supabase auth is not configured for this environment.</p>
    <p class="m-0">
      Set `SUPABASE_URL`, `SUPABASE_SECRET_KEY`, `VITE_SUPABASE_URL`, and
      `VITE_SUPABASE_PUBLISHABLE_KEY`.
    </p>
  </div>
{:else}
  <div class="grid gap-4">
    {#if authConfig.providers.github || authConfig.providers.google || authConfig.providers.apple}
      <div class="grid gap-2">
        {#if authConfig.providers.github}
          <button
            class="flex items-center justify-center gap-2.5 rounded-2xl border border-border/80 bg-card/70 px-4 py-3 text-sm font-medium transition hover:bg-secondary disabled:opacity-60"
            onclick={() => void handleSso('github')}
            disabled={isSubmitting}
          >
            <PlatformIcons provider="github" size="sm" />
            <span>Continue with GitHub</span>
          </button>
        {/if}
        {#if authConfig.providers.google}
          <button
            class="flex items-center justify-center gap-2.5 rounded-2xl border border-border/80 bg-card/70 px-4 py-3 text-sm font-medium transition hover:bg-secondary disabled:opacity-60"
            onclick={() => void handleSso('google')}
            disabled={isSubmitting}
          >
            <PlatformIcons provider="google" size="sm" />
            <span>Continue with Google</span>
          </button>
        {/if}
        {#if authConfig.providers.apple}
          <button
            class="flex items-center justify-center gap-2.5 rounded-2xl border border-border/80 bg-card/70 px-4 py-3 text-sm font-medium transition hover:bg-secondary disabled:opacity-60"
            onclick={() => void handleSso('apple')}
            disabled={isSubmitting}
          >
            <PlatformIcons provider="apple" size="sm" />
            <span>Continue with Apple</span>
          </button>
        {/if}
      </div>
    {/if}

    {#if authConfig.providers.email}
      {#if authConfig.providers.github || authConfig.providers.google || authConfig.providers.apple}
        <div class="flex items-center gap-3">
          <div class="h-px flex-1 bg-border/70"></div>
          <span class="text-xs text-muted-foreground">or</span>
          <div class="h-px flex-1 bg-border/70"></div>
        </div>
      {/if}

      <div class="inline-flex w-fit rounded-full border border-border bg-secondary p-1">
        <button
          type="button"
          class={`rounded-full px-4 py-2 text-sm font-semibold transition ${mode === 'sign-in' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'}`}
          onclick={() => {
            mode = 'sign-in'
            error = null
            message = null
          }}
        >
          Sign In
        </button>
        <button
          type="button"
          class={`rounded-full px-4 py-2 text-sm font-semibold transition ${mode === 'sign-up' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'}`}
          onclick={() => {
            mode = 'sign-up'
            error = null
            message = null
          }}
        >
          Create Account
        </button>
      </div>

      <form class="grid gap-3" onsubmit={handleSubmit}>
        {#if mode === 'sign-up'}
          <label class="grid gap-2">
            <span class="text-sm font-medium text-foreground">Name</span>
            <input
              bind:value={name}
              class="rounded-2xl border border-input bg-card px-4 py-3 outline-none focus:border-primary"
              placeholder="Jane Doe"
              autocomplete="name"
            />
          </label>
        {/if}

        <label class="grid gap-2">
          <span class="text-sm font-medium text-foreground">Email</span>
          <input
            bind:value={email}
            class="rounded-2xl border border-input bg-card px-4 py-3 outline-none focus:border-primary"
            placeholder="you@example.com"
            autocomplete="email"
            type="email"
            required
          />
        </label>

        <label class="grid gap-2">
          <span class="text-sm font-medium text-foreground">Password</span>
          <input
            bind:value={password}
            class="rounded-2xl border border-input bg-card px-4 py-3 outline-none focus:border-primary"
            placeholder="At least 8 characters"
            autocomplete={mode === 'sign-in' ? 'current-password' : 'new-password'}
            type="password"
            minlength="8"
            required
          />
        </label>

        <button
          type="submit"
          class="rounded-2xl bg-primary px-4 py-3 text-sm font-bold text-primary-foreground transition hover:brightness-110 disabled:opacity-50"
          disabled={isSubmitting}
        >
          {#if isSubmitting}
            {mode === 'sign-in' ? 'Signing In...' : 'Creating Account...'}
          {:else}
            {mode === 'sign-in' ? 'Sign In' : 'Create Account'}
          {/if}
        </button>
      </form>
    {/if}

    {#if error}
      <p class="m-0 text-sm text-destructive">{error}</p>
    {/if}
    {#if message}
      <p class="m-0 text-sm text-muted-foreground">{message}</p>
    {/if}
  </div>
{/if}

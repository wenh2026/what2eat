"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { User, LogIn, Mail } from "lucide-react";
import { supabase } from "@/lib/supabase";

export function AuthDialog() {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [session, setSession] = useState<any>(null);

  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (session) return null;

  const handleAuth = async (event: React.FormEvent<HTMLFormElement>, type: 'login' | 'register') => {
    event.preventDefault();
    setLoading(true);
    setMessage(null);

    const formData = new FormData(event.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    if (!supabase) {
        setMessage({ type: 'error', text: 'Supabase 未配置' });
        setLoading(false);
        return;
    }

    try {
      let error;
      if (type === 'register') {
        const { error: signUpError } = await supabase.auth.signUp({
          email,
          password,
        });
        error = signUpError;
        if (!error) {
            setMessage({ type: 'success', text: '注册成功！请检查邮箱完成验证。' });
        }
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        error = signInError;
        if (!error) {
            setIsOpen(false); // Close dialog on success
            window.location.reload(); // Simple reload to update state
        }
      }

      if (error) throw error;

    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || '操作失败，请重试' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <button className="p-2 bg-white/50 dark:bg-card/50 backdrop-blur-sm rounded-full border border-orange-200 dark:border-border text-orange-700 dark:text-orange-300 hover:bg-orange-50 dark:hover:bg-secondary transition-colors">
          <User className="w-5 h-5" />
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-center text-2xl font-bold text-primary">欢迎来到吃啥AI</DialogTitle>
        </DialogHeader>
        
        <Tabs defaultValue="login" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="login">登录</TabsTrigger>
            <TabsTrigger value="register">注册</TabsTrigger>
          </TabsList>
          
          {/* Login Form */}
          <TabsContent value="login">
            <form onSubmit={(e) => handleAuth(e, 'login')} className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="email-login">邮箱</Label>
                <Input id="email-login" name="email" type="email" placeholder="name@example.com" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password-login">密码</Label>
                <Input id="password-login" name="password" type="password" required />
              </div>
              {message && (
                  <p className={`text-sm ${message.type === 'error' ? 'text-red-500' : 'text-green-500'}`}>
                      {message.text}
                  </p>
              )}
              <button 
                type="submit" 
                disabled={loading}
                className="w-full py-2 bg-primary text-white font-bold rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-50"
              >
                {loading ? "登录中..." : "立即登录"}
              </button>
            </form>
          </TabsContent>

          {/* Register Form */}
          <TabsContent value="register">
            <form onSubmit={(e) => handleAuth(e, 'register')} className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="email-register">邮箱</Label>
                <Input id="email-register" name="email" type="email" placeholder="name@example.com" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password-register">密码</Label>
                <Input id="password-register" name="password" type="password" required />
              </div>
              {message && (
                  <p className={`text-sm ${message.type === 'error' ? 'text-red-500' : 'text-green-500'}`}>
                      {message.text}
                  </p>
              )}
              <button 
                type="submit" 
                disabled={loading}
                className="w-full py-2 bg-secondary text-secondary-foreground font-bold rounded-lg hover:bg-orange-300 transition-colors disabled:opacity-50"
              >
                {loading ? "注册中..." : "创建账号"}
              </button>
            </form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

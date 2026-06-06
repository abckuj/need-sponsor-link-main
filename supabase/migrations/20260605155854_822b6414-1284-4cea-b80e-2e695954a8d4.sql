
-- Enums
CREATE TYPE public.app_role AS ENUM ('beneficiary', 'sponsor', 'admin');
CREATE TYPE public.case_category AS ENUM ('education', 'medical', 'senior_care', 'child_welfare', 'single_mother', 'emergency');
CREATE TYPE public.case_status AS ENUM ('submitted', 'under_review', 'verified', 'sponsored', 'completed', 'rejected');
CREATE TYPE public.urgency_level AS ENUM ('low', 'medium', 'high', 'critical');

-- Profiles
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  phone TEXT,
  city TEXT,
  country TEXT,
  avatar_url TEXT,
  bio TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT SELECT ON public.profiles TO anon;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- User roles
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE POLICY "Users can view their own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage roles" ON public.user_roles FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Cases
CREATE TABLE public.cases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  beneficiary_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  category case_category NOT NULL,
  story TEXT NOT NULL,
  amount_needed NUMERIC(12,2) NOT NULL CHECK (amount_needed > 0),
  amount_raised NUMERIC(12,2) NOT NULL DEFAULT 0,
  deadline DATE,
  urgency urgency_level NOT NULL DEFAULT 'medium',
  priority_score INT NOT NULL DEFAULT 50,
  status case_status NOT NULL DEFAULT 'submitted',
  verification_level INT NOT NULL DEFAULT 0,
  city TEXT,
  country TEXT,
  institution_name TEXT,
  institution_type TEXT,
  image_url TEXT,
  beneficiary_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.cases TO anon;
GRANT SELECT, INSERT, UPDATE ON public.cases TO authenticated;
GRANT ALL ON public.cases TO service_role;
ALTER TABLE public.cases ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can view verified cases" ON public.cases FOR SELECT USING (status IN ('verified','sponsored','completed'));
CREATE POLICY "Beneficiaries view own cases" ON public.cases FOR SELECT USING (auth.uid() = beneficiary_id);
CREATE POLICY "Admins view all cases" ON public.cases FOR SELECT USING (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Beneficiaries create cases" ON public.cases FOR INSERT WITH CHECK (auth.uid() = beneficiary_id);
CREATE POLICY "Beneficiaries update own cases" ON public.cases FOR UPDATE USING (auth.uid() = beneficiary_id);
CREATE POLICY "Admins update cases" ON public.cases FOR UPDATE USING (public.has_role(auth.uid(),'admin'));

-- Sponsorships
CREATE TABLE public.sponsorships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sponsor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  case_id UUID NOT NULL REFERENCES public.cases(id) ON DELETE CASCADE,
  amount NUMERIC(12,2) NOT NULL CHECK (amount > 0),
  message TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.sponsorships TO authenticated;
GRANT ALL ON public.sponsorships TO service_role;
ALTER TABLE public.sponsorships ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Sponsors view own sponsorships" ON public.sponsorships FOR SELECT USING (auth.uid() = sponsor_id);
CREATE POLICY "Beneficiaries view sponsorships on their cases" ON public.sponsorships FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.cases c WHERE c.id = case_id AND c.beneficiary_id = auth.uid()));
CREATE POLICY "Admins view all sponsorships" ON public.sponsorships FOR SELECT USING (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Sponsors create sponsorships" ON public.sponsorships FOR INSERT WITH CHECK (auth.uid() = sponsor_id);

-- Updated_at trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER cases_updated_at BEFORE UPDATE ON public.cases FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-create profile + default role on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email));
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, COALESCE((NEW.raw_user_meta_data->>'role')::app_role, 'sponsor'));
  RETURN NEW;
END; $$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Trigger to update case amount_raised + status on new sponsorship
CREATE OR REPLACE FUNCTION public.update_case_on_sponsorship()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE public.cases
  SET amount_raised = amount_raised + NEW.amount,
      status = CASE WHEN amount_raised + NEW.amount >= amount_needed THEN 'completed'::case_status ELSE 'sponsored'::case_status END
  WHERE id = NEW.case_id;
  RETURN NEW;
END; $$;

CREATE TRIGGER on_sponsorship_created AFTER INSERT ON public.sponsorships
  FOR EACH ROW EXECUTE FUNCTION public.update_case_on_sponsorship();

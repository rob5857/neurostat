"""Genera valores de referencia con SciPy para verificar los cálculos de NeuroStat.
Uso: python referencia_scipy.py > referencia.json
"""
import json, math, sys
import numpy as np, scipy
from scipy import stats, special

def datasets():
    i40 = np.arange(40); i60 = np.arange(60); i25 = np.arange(25)
    return {
        "A_n5_n6": ([18.2, 22.1, 19.5, 24.3, 17.8], [25.1, 30.2, 21.7, 28.4, 35.0, 26.3]),
        "B_n3_n3": ([20.1, 19.4, 22.3], [24.8, 21.0, 29.9]),
        "C_n40_n60": ((20 + 5*np.sin(i40*1.7) + 0.3*(i40 % 7)).tolist(),
                      (21 + 6*np.cos(i60*0.9) + 0.2*(i60 % 5)).tolist()),
        "D_p_diminuto": ((10 + np.sin(i25)).tolist(), (14 + np.cos(i25*1.3)).tolist()),
        "E_casi_nulo": ([5.1, 4.9, 5.6, 5.8, 6.0, 4.7, 5.3], [5.2, 5.0, 5.5, 5.9, 5.7, 4.8, 5.4, 5.1]),
    }

out = {"scipy": scipy.__version__, "numpy": np.__version__, "welch": [], "tq": [], "p2": [], "J": []}
for name, (a, b) in datasets().items():
    r = stats.ttest_ind(b, a, equal_var=False)          # tratamiento - control
    ci = r.confidence_interval(0.95)
    out["welch"].append({"caso": name, "a": a, "b": b, "t": float(r.statistic), "df": float(r.df),
                         "p": float(r.pvalue), "lo": float(ci.low), "hi": float(ci.high)})
for df in [1, 2.5, 4.37, 10, 30.2, 100, 598]:
    out["tq"].append({"df": df, "q": float(stats.t.ppf(0.975, df))})
for t, df in [(2.0, 5), (0.5, 3.3), (4.5, 12.7), (10, 40), (1.96, 1000), (25, 8)]:
    out["p2"].append({"t": t, "df": df, "p": float(2*stats.t.sf(t, df))})
for df in [4, 18, 58, 598]:
    J = math.exp(special.gammaln(df/2) - special.gammaln((df-1)/2)) / math.sqrt(df/2)
    out["J"].append({"df": df, "J": J})
json.dump(out, sys.stdout)
